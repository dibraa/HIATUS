-- ============================================================================
-- 001 — Size-aware order pricing
-- ----------------------------------------------------------------------------
-- WHY THIS EXISTS
--
-- The storefront lets a customer pick a drink size (S / M / L), and small and
-- large carry a price delta. `create_order` deliberately re-derives every line
-- price server-side so a client cannot dictate what an order costs — which
-- means the server has to know about the deltas too.
--
-- Without this patch the cart quotes, say, ₱145 for a large and the order is
-- recorded at the ₱120 medium price. The customer sees one number and is
-- charged another. Run this patch, or set every `priceDelta` in
-- src/lib/sizes.ts to 0 so size is a preference and not a price.
--
-- Safe to run on an existing database: additive column, and the function is
-- replaced rather than dropped. Re-running it is a no-op.
--
-- KEEP THE DELTAS BELOW IN SYNC WITH `SIZE_OPTIONS` in src/lib/sizes.ts.
-- ============================================================================

-- 1. Record which size was ordered, so the shop knows what to make and the
--    order history can show it. Nullable: rows predating this patch have no
--    size, and are read as the default (medium).
alter table public.order_items
  add column if not exists size text
  check (size is null or size in ('S', 'M', 'L'));

comment on column public.order_items.size is
  'Drink size ordered (S/M/L). Null on rows created before size support; treat as M.';

-- 2. Single source of truth for the server-side price delta.
create or replace function public.hiatus_size_delta(size_code text)
returns numeric
language sql
immutable
set search_path = public
as $$
  select case upper(coalesce(size_code, 'M'))
    when 'S' then -15::numeric   -- keep in sync with SIZE_OPTIONS
    when 'M' then 0::numeric
    when 'L' then 25::numeric
    else 0::numeric
  end;
$$;

-- 3. create_order, now size-aware. Everything else is unchanged from
--    supabase/schema.sql: still SECURITY DEFINER, still rejects unavailable
--    items and non-positive quantities, still computes the total itself.
create or replace function public.create_order(items jsonb, pickup_note text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_order_id uuid;
  computed_total numeric(10, 2) := 0;
  line jsonb;
  item public.menu_items%rowtype;
  line_qty integer;
  line_size text;
  line_unit_price numeric(10, 2);
  line_subtotal numeric(10, 2);
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if jsonb_array_length(items) = 0 then
    raise exception 'cart is empty';
  end if;

  insert into public.orders (user_id, status, total_amount, pickup_note)
  values (auth.uid(), 'pending', 0, pickup_note)
  returning id into new_order_id;

  for line in select * from jsonb_array_elements(items)
  loop
    select * into item from public.menu_items
      where id = (line ->> 'menu_item_id')::uuid and is_available = true;

    if not found then
      raise exception 'menu item % is not available', line ->> 'menu_item_id';
    end if;

    line_qty := (line ->> 'quantity')::integer;
    if line_qty is null or line_qty <= 0 then
      raise exception 'invalid quantity for menu item %', item.id;
    end if;

    -- Unknown or missing sizes fall back to medium rather than erroring, so an
    -- older client that does not send a size still places a valid order.
    line_size := upper(coalesce(line ->> 'size', 'M'));
    if line_size not in ('S', 'M', 'L') then
      line_size := 'M';
    end if;

    -- greatest(...) mirrors the client's floor at 0: a delta can never turn a
    -- price negative, however the menu price is edited.
    line_unit_price := greatest(0, item.price + public.hiatus_size_delta(line_size));
    line_subtotal := line_unit_price * line_qty;
    computed_total := computed_total + line_subtotal;

    insert into public.order_items
      (order_id, menu_item_id, item_name, flavor, size, unit_price, quantity, subtotal)
    values
      (new_order_id, item.id, item.name, item.flavor, line_size, line_unit_price,
       line_qty, line_subtotal);
  end loop;

  update public.orders set total_amount = computed_total where id = new_order_id;

  return new_order_id;
end;
$$;

grant execute on function public.create_order(jsonb, text) to authenticated;
grant execute on function public.hiatus_size_delta(text) to authenticated;

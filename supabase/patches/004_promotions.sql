-- ============================================================================
-- 004 — Promotional codes, order-level discounts, and the final create_order
-- ----------------------------------------------------------------------------
-- WHY THIS EXISTS
--
-- A discount is the one number in an order a customer has an incentive to
-- change, so none of it may be computed on the client. `evaluate_promo` is the
-- single implementation of "is this code good, and what is it worth"; the
-- checkout screen calls it to PREVIEW a discount and `create_order` calls the
-- same function to APPLY one. There is no second copy of the rules to drift.
--
-- Orders grow three money columns. `total_amount` keeps its meaning — what the
-- customer pays — so everything already reading it stays correct:
--
--     subtotal_amount   sum of the lines, before any discount
--     discount_amount   promo + manual, always >= 0
--     total_amount      subtotal_amount - discount_amount   (what is owed)
--
-- ⚠ THIS PATCH DROPS create_order(jsonb, text) and replaces it with a wider
-- signature. Dropping rather than overloading is deliberate: Postgres would
-- otherwise keep both, and a two-argument call would become ambiguous and
-- fail at runtime rather than at deploy.
--
-- Run AFTER 001, 002 and 003. Re-running it is a no-op.
-- ============================================================================

-- ============================================================================
-- 1. Order money columns
-- ============================================================================
alter table public.orders
  add column if not exists subtotal_amount numeric(10, 2) not null default 0;
alter table public.orders
  add column if not exists discount_amount numeric(10, 2) not null default 0;
alter table public.orders
  add column if not exists promo_code text;

-- Backfill: pre-patch orders had no discount, so their subtotal is their total.
-- Guarded so a re-run cannot rewrite rows that have since been discounted.
update public.orders
  set subtotal_amount = total_amount
  where subtotal_amount = 0 and total_amount > 0 and discount_amount = 0;

-- ============================================================================
-- 2. Promotions
-- ============================================================================
create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  description text,
  discount_type text not null check (discount_type in ('percent', 'fixed')),
  discount_value numeric(10, 2) not null check (discount_value > 0),
  min_order_amount numeric(10, 2) not null default 0 check (min_order_amount >= 0),
  -- Caps a percent promo in money terms. Null means uncapped; meaningless for
  -- a fixed promo, which is its own cap.
  max_discount_amount numeric(10, 2) check (max_discount_amount is null or max_discount_amount > 0),
  starts_at timestamptz,
  ends_at timestamptz,
  -- Null means unlimited for both.
  usage_limit integer check (usage_limit is null or usage_limit > 0),
  per_user_limit integer check (per_user_limit is null or per_user_limit > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Codes are matched case-insensitively (a customer typing "welcome10" means
-- WELCOME10), so uniqueness has to be case-insensitive too or the shop could
-- create two codes only the database can tell apart.
create unique index if not exists promotions_code_unique
  on public.promotions (upper(code));

alter table public.promotions enable row level security;

-- Deliberately NOT publicly readable. Listing every live code would let anyone
-- help themselves to the best one; a customer validates a code they already
-- know by calling evaluate_promo, which is security definer.
drop policy if exists "promotions_staff_read" on public.promotions;
create policy "promotions_staff_read"
  on public.promotions for select
  using (public.is_staff());

drop policy if exists "promotions_admin_write" on public.promotions;
create policy "promotions_admin_write"
  on public.promotions for all
  using (public.is_admin())
  with check (public.is_admin());

alter table public.orders
  add column if not exists promotion_id uuid references public.promotions (id) on delete set null;

-- ============================================================================
-- 3. Redemptions — what was actually used, and by whom
-- ============================================================================
create table if not exists public.promo_redemptions (
  id uuid primary key default gen_random_uuid(),
  promotion_id uuid not null references public.promotions (id) on delete cascade,
  order_id uuid not null references public.orders (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  discount_amount numeric(10, 2) not null,
  created_at timestamptz not null default now(),
  -- One redemption per order. Also what makes the per-user count below exact
  -- rather than approximate.
  unique (order_id)
);

create index if not exists promo_redemptions_promo_idx
  on public.promo_redemptions (promotion_id);
create index if not exists promo_redemptions_user_idx
  on public.promo_redemptions (user_id, promotion_id);

alter table public.promo_redemptions enable row level security;

drop policy if exists "promo_redemptions_select" on public.promo_redemptions;
create policy "promo_redemptions_select"
  on public.promo_redemptions for select
  using (user_id = auth.uid() or public.is_staff());

-- ============================================================================
-- 4. evaluate_promo — the single source of truth for what a code is worth
-- ----------------------------------------------------------------------------
-- Returns a verdict rather than raising, because the checkout screen needs to
-- SHOW why a code was refused ("spend ₱50 more") without an error boundary.
-- create_order raises on the same verdict; the difference in handling belongs
-- to the caller, not to the rule.
-- ============================================================================
create or replace function public.evaluate_promo(
  promo_code text,
  order_subtotal numeric,
  for_user uuid default null
)
returns table (
  valid boolean,
  promotion_id uuid,
  code text,
  discount numeric,
  message text
)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  p public.promotions%rowtype;
  used_total integer;
  used_by_user integer;
  computed numeric(10, 2);
  target_user uuid := coalesce(for_user, auth.uid());
begin
  if promo_code is null or trim(promo_code) = '' then
    return query select false, null::uuid, null::text, 0::numeric, 'Enter a code.'::text;
    return;
  end if;

  select * into p from public.promotions where upper(code) = upper(trim(promo_code));

  if not found then
    return query select false, null::uuid, null::text, 0::numeric,
      'That code is not recognised.'::text;
    return;
  end if;

  if not p.is_active then
    return query select false, null::uuid, p.code, 0::numeric,
      'That code is no longer active.'::text;
    return;
  end if;

  if p.starts_at is not null and now() < p.starts_at then
    return query select false, null::uuid, p.code, 0::numeric,
      'That code is not available yet.'::text;
    return;
  end if;

  if p.ends_at is not null and now() > p.ends_at then
    return query select false, null::uuid, p.code, 0::numeric,
      'That code has expired.'::text;
    return;
  end if;

  if order_subtotal < p.min_order_amount then
    return query select false, null::uuid, p.code, 0::numeric,
      format('Spend at least %s to use this code.', to_char(p.min_order_amount, 'FM999999.00'));
    return;
  end if;

  if p.usage_limit is not null then
    select count(*) into used_total from public.promo_redemptions where promotion_id = p.id;
    if used_total >= p.usage_limit then
      return query select false, null::uuid, p.code, 0::numeric,
        'That code has been fully claimed.'::text;
      return;
    end if;
  end if;

  if p.per_user_limit is not null and target_user is not null then
    select count(*) into used_by_user
      from public.promo_redemptions
      where promotion_id = p.id and user_id = target_user;
    if used_by_user >= p.per_user_limit then
      return query select false, null::uuid, p.code, 0::numeric,
        'You have already used that code.'::text;
      return;
    end if;
  end if;

  if p.discount_type = 'percent' then
    computed := round(order_subtotal * p.discount_value / 100, 2);
    if p.max_discount_amount is not null then
      computed := least(computed, p.max_discount_amount);
    end if;
  else
    computed := p.discount_value;
  end if;

  -- A discount can never exceed the order, so a promo cannot produce a
  -- negative total the shop would owe the customer.
  computed := least(computed, order_subtotal);

  return query select true, p.id, p.code, computed,
    format('%s applied.', upper(p.code));
end;
$$;

grant execute on function public.evaluate_promo(text, numeric, uuid) to authenticated;
grant execute on function public.evaluate_promo(text, numeric, uuid) to anon;

-- ============================================================================
-- 5. create_order — size-aware (001), now also type/payment/promo aware
-- ----------------------------------------------------------------------------
-- Drop the narrower signature first. See the header: keeping both would make
-- a two-argument call ambiguous.
-- ============================================================================
drop function if exists public.create_order(jsonb, text);

create or replace function public.create_order(
  items jsonb,
  pickup_note text default null,
  order_type text default 'takeout',
  payment_method text default 'cash',
  promo_code text default null,
  table_label text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_order_id uuid;
  computed_subtotal numeric(10, 2) := 0;
  line jsonb;
  item public.menu_items%rowtype;
  line_qty integer;
  line_size text;
  line_unit_price numeric(10, 2);
  line_subtotal numeric(10, 2);
  verdict record;
  applied_discount numeric(10, 2) := 0;
  applied_promo_id uuid;
  applied_code text;
  safe_type text;
  safe_method text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  if items is null or jsonb_array_length(items) = 0 then
    raise exception 'cart is empty';
  end if;

  -- Unknown values fall back to the v1 defaults rather than erroring, so an
  -- older client that does not send them still places a valid order.
  safe_type := lower(coalesce(order_type, 'takeout'));
  if safe_type not in ('dine_in', 'takeout') then
    safe_type := 'takeout';
  end if;

  safe_method := lower(coalesce(payment_method, 'cash'));
  if safe_method not in ('cash', 'card', 'ewallet') then
    safe_method := 'cash';
  end if;

  insert into public.orders
    (user_id, status, subtotal_amount, discount_amount, total_amount,
     pickup_note, order_type, payment_method, table_label)
  values
    (auth.uid(), 'pending', 0, 0, 0,
     pickup_note, safe_type, safe_method,
     case when safe_type = 'dine_in' then nullif(trim(coalesce(table_label, '')), '') end)
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

    line_size := upper(coalesce(line ->> 'size', 'M'));
    if line_size not in ('S', 'M', 'L') then
      line_size := 'M';
    end if;

    -- greatest(...) mirrors the client's floor at 0: a delta can never turn a
    -- price negative, however the menu price is edited.
    line_unit_price := greatest(0, item.price + public.hiatus_size_delta(line_size));
    line_subtotal := line_unit_price * line_qty;
    computed_subtotal := computed_subtotal + line_subtotal;

    insert into public.order_items
      (order_id, menu_item_id, item_name, flavor, size, unit_price, quantity, subtotal)
    values
      (new_order_id, item.id, item.name, item.flavor, line_size, line_unit_price,
       line_qty, line_subtotal);
  end loop;

  -- The promo is evaluated against the SERVER's subtotal, not a number the
  -- client sent, which is the whole reason pricing lives in here.
  if promo_code is not null and trim(promo_code) <> '' then
    select * into verdict
      from public.evaluate_promo(promo_code, computed_subtotal, auth.uid());

    if not verdict.valid then
      raise exception '%', verdict.message;
    end if;

    applied_discount := verdict.discount;
    applied_promo_id := verdict.promotion_id;
    applied_code := verdict.code;

    insert into public.promo_redemptions
      (promotion_id, order_id, user_id, discount_amount)
    values (applied_promo_id, new_order_id, auth.uid(), applied_discount);
  end if;

  update public.orders
    set subtotal_amount = computed_subtotal,
        discount_amount = applied_discount,
        total_amount = computed_subtotal - applied_discount,
        promotion_id = applied_promo_id,
        promo_code = applied_code
    where id = new_order_id;

  return new_order_id;
end;
$$;

grant execute on function public.create_order(jsonb, text, text, text, text, text) to authenticated;

-- ============================================================================
-- 6. Manual discount — the counter's override, always with a reason
-- ----------------------------------------------------------------------------
-- Adds to whatever the promo already took off rather than replacing it, and is
-- capped so the total can never go below zero. Every use is logged, because
-- "who discounted this and why" is the first question asked when a drawer is
-- short.
-- ============================================================================
create or replace function public.apply_manual_discount(
  target_order_id uuid,
  extra_discount numeric,
  reason text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  o public.orders%rowtype;
  new_discount numeric(10, 2);
begin
  if not public.is_staff() then
    raise exception 'not authorized';
  end if;

  if extra_discount is null or extra_discount <= 0 then
    raise exception 'discount must be a positive amount';
  end if;

  if reason is null or trim(reason) = '' then
    raise exception 'a reason is required for a manual discount';
  end if;

  select * into o from public.orders where id = target_order_id;

  if not found then
    raise exception 'order not found';
  end if;

  if o.payment_status = 'paid' then
    raise exception 'this order is already paid — issue a refund instead';
  end if;

  new_discount := least(o.discount_amount + extra_discount, o.subtotal_amount);

  update public.orders
    set discount_amount = new_discount,
        total_amount = o.subtotal_amount - new_discount,
        updated_at = now()
    where id = target_order_id;

  perform public.log_staff_activity(
    'manual_discount', target_order_id,
    format('%s off — %s', extra_discount, reason)
  );
end;
$$;

grant execute on function public.apply_manual_discount(uuid, numeric, text) to authenticated;

-- ============================================================================
-- 7. Campaign performance
-- ============================================================================
create or replace function public.promo_performance()
returns table (
  id uuid,
  code text,
  description text,
  discount_type text,
  discount_value numeric,
  is_active boolean,
  starts_at timestamptz,
  ends_at timestamptz,
  usage_limit integer,
  redemptions bigint,
  discount_given numeric,
  revenue_influenced numeric
)
language sql
security definer
set search_path = public
stable
as $$
  select
    p.id,
    p.code,
    p.description,
    p.discount_type,
    p.discount_value,
    p.is_active,
    p.starts_at,
    p.ends_at,
    p.usage_limit,
    count(r.id)::bigint as redemptions,
    coalesce(sum(r.discount_amount), 0) as discount_given,
    -- What the shop still took on orders that used the code — the number that
    -- says whether the campaign was worth running.
    coalesce(sum(o.total_amount) filter (where o.status = 'completed'), 0) as revenue_influenced
  from public.promotions p
  left join public.promo_redemptions r on r.promotion_id = p.id
  left join public.orders o on o.id = r.order_id
  where public.is_admin()
  group by p.id
  order by count(r.id) desc, p.created_at desc;
$$;

grant execute on function public.promo_performance() to authenticated;

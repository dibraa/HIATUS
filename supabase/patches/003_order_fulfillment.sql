-- ============================================================================
-- 003 — Fulfillment: dine-in vs takeout, tables, queue priority, payments
-- ----------------------------------------------------------------------------
-- WHY THIS EXISTS
--
-- v1 was pickup-only and cash-on-pickup, so an order needed no more than a
-- status. Serving a room needs three more facts: where the drink is going
-- (a table or the counter), where it sits in the queue, and whether the money
-- has actually changed hands.
--
-- That last one is deliberately NOT a boolean on `orders`. Money needs a
-- LEDGER: a refund is a new fact, not the erasure of the payment it reverses,
-- and "reconcile the drawer" is a question you can only answer by summing
-- events. So `payments` is append-only and `orders.payment_status` is a
-- cached read of it, maintained by the functions below.
--
-- Safe to run on an existing database: additive, functions replaced not
-- dropped. Re-running it is a no-op.
-- ============================================================================

-- ============================================================================
-- 1. Where the order is going
-- ============================================================================
alter table public.orders
  add column if not exists order_type text not null default 'takeout';

alter table public.orders drop constraint if exists orders_order_type_check;
alter table public.orders
  add constraint orders_order_type_check
  check (order_type in ('dine_in', 'takeout'));

-- Free text, not a foreign key to a `tables` table. A shop that rearranges its
-- floor should not need a migration, and "by the window" is a legitimate answer.
alter table public.orders
  add column if not exists table_label text;

comment on column public.orders.table_label is
  'Dine-in seat assignment. Free text so the floor plan is not a schema.';

-- ============================================================================
-- 2. Queue priority
-- ----------------------------------------------------------------------------
-- Higher sorts first; the queue then orders by (priority desc, created_at asc)
-- so an unbumped queue is still plain first-come-first-served. An integer
-- rather than a hand-maintained position column: bumping one ticket must not
-- rewrite every other row.
-- ============================================================================
alter table public.orders
  add column if not exists priority integer not null default 0;

create index if not exists orders_queue_idx
  on public.orders (priority desc, created_at asc)
  where status in ('pending', 'preparing', 'ready');

-- ============================================================================
-- 3. How it was paid
-- ============================================================================
alter table public.orders
  add column if not exists payment_method text not null default 'cash';

alter table public.orders drop constraint if exists orders_payment_method_check;
alter table public.orders
  add constraint orders_payment_method_check
  check (payment_method in ('cash', 'card', 'ewallet'));

alter table public.orders
  add column if not exists payment_status text not null default 'unpaid';

alter table public.orders drop constraint if exists orders_payment_status_check;
alter table public.orders
  add constraint orders_payment_status_check
  check (payment_status in ('unpaid', 'paid', 'refunded', 'voided'));

alter table public.orders
  add column if not exists paid_at timestamptz;

comment on column public.orders.payment_status is
  'Cached rollup of the public.payments ledger. The ledger is the source of truth.';

-- ============================================================================
-- 4. The payment ledger
-- ============================================================================
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  -- Nullable: a staff account can be deleted, and losing the person must not
  -- take the transaction record with it.
  staff_id uuid references public.profiles (id) on delete set null,
  kind text not null check (kind in ('payment', 'refund', 'void')),
  method text not null check (method in ('cash', 'card', 'ewallet')),
  -- Always positive. The sign lives in `kind`, so a careless sum of the amount
  -- column cannot silently net a refund against a payment.
  amount numeric(10, 2) not null check (amount >= 0),
  reference text,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists payments_order_idx on public.payments (order_id);
create index if not exists payments_created_idx on public.payments (created_at desc);

alter table public.payments enable row level security;

-- A customer can see the record of their own money; staff see the till.
drop policy if exists "payments_select" on public.payments;
create policy "payments_select"
  on public.payments for select
  using (
    public.is_staff()
    or exists (
      select 1 from public.orders o
      where o.id = payments.order_id and o.user_id = auth.uid()
    )
  );

-- No insert/update/delete policies. The ledger is append-only through the
-- functions below, and nothing is ever deleted from it.

-- ============================================================================
-- 5. POS operations
-- ============================================================================

create or replace function public.record_payment(
  target_order_id uuid,
  pay_method text,
  pay_amount numeric default null,
  pay_reference text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  order_total numeric(10, 2);
  order_state text;
  already_paid text;
  charge numeric(10, 2);
begin
  if not public.is_staff() then
    raise exception 'not authorized';
  end if;

  if pay_method not in ('cash', 'card', 'ewallet') then
    raise exception 'invalid payment method %', pay_method;
  end if;

  select total_amount, status, payment_status
    into order_total, order_state, already_paid
    from public.orders where id = target_order_id;

  if order_total is null then
    raise exception 'order not found';
  end if;

  if order_state = 'cancelled' then
    raise exception 'cannot take payment on a cancelled order';
  end if;

  if already_paid = 'paid' then
    raise exception 'this order is already paid';
  end if;

  -- Defaulting to the order total is what makes the common case one tap at the
  -- counter. A passed amount is only for a split or partial tender.
  charge := coalesce(pay_amount, order_total);

  if charge < 0 then
    raise exception 'payment amount cannot be negative';
  end if;

  insert into public.payments (order_id, staff_id, kind, method, amount, reference)
  values (target_order_id, auth.uid(), 'payment', pay_method, charge, pay_reference);

  update public.orders
    set payment_status = 'paid',
        payment_method = pay_method,
        paid_at = now(),
        updated_at = now()
    where id = target_order_id;

  perform public.log_staff_activity(
    'payment', target_order_id, format('%s %s', pay_method, charge)
  );
end;
$$;

create or replace function public.refund_payment(
  target_order_id uuid,
  refund_amount numeric default null,
  refund_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  paid_total numeric(10, 2);
  refunded_total numeric(10, 2);
  refundable numeric(10, 2);
  amount_to_refund numeric(10, 2);
  order_method text;
begin
  if not public.is_staff() then
    raise exception 'not authorized';
  end if;

  -- Computed from the ledger, never from orders.total_amount: the total can be
  -- edited by a manual discount after the fact, and a refund must be bounded
  -- by what was actually taken.
  select
    coalesce(sum(amount) filter (where kind = 'payment'), 0),
    coalesce(sum(amount) filter (where kind in ('refund', 'void')), 0)
    into paid_total, refunded_total
    from public.payments where order_id = target_order_id;

  refundable := paid_total - refunded_total;

  if refundable <= 0 then
    raise exception 'nothing left to refund on this order';
  end if;

  amount_to_refund := coalesce(refund_amount, refundable);

  if amount_to_refund <= 0 then
    raise exception 'refund amount must be positive';
  end if;

  if amount_to_refund > refundable then
    raise exception 'cannot refund % — only % remains', amount_to_refund, refundable;
  end if;

  select payment_method into order_method from public.orders where id = target_order_id;

  insert into public.payments (order_id, staff_id, kind, method, amount, reason)
  values (target_order_id, auth.uid(), 'refund', coalesce(order_method, 'cash'),
          amount_to_refund, refund_reason);

  update public.orders
    set payment_status = case
          -- A partial refund leaves the order paid; only a full one flips it.
          when amount_to_refund >= refundable then 'refunded'
          else payment_status
        end,
        updated_at = now()
    where id = target_order_id;

  perform public.log_staff_activity(
    'refund', target_order_id,
    format('%s refunded%s', amount_to_refund, coalesce(' — ' || refund_reason, ''))
  );
end;
$$;

-- A void is not a refund: it cancels a transaction that should never have been
-- rung up (wrong ticket, mis-key), and it cancels the ORDER along with it.
create or replace function public.void_order(target_order_id uuid, void_reason text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  taken numeric(10, 2);
  order_method text;
begin
  if not public.is_staff() then
    raise exception 'not authorized';
  end if;

  select
    coalesce(sum(amount) filter (where kind = 'payment'), 0)
      - coalesce(sum(amount) filter (where kind in ('refund', 'void')), 0)
    into taken
    from public.payments where order_id = target_order_id;

  select payment_method into order_method from public.orders where id = target_order_id;

  if order_method is null then
    raise exception 'order not found';
  end if;

  -- Only writes a reversing ledger row if money was actually taken; voiding an
  -- unpaid ticket is a status change, not a transaction.
  if taken > 0 then
    insert into public.payments (order_id, staff_id, kind, method, amount, reason)
    values (target_order_id, auth.uid(), 'void', order_method, taken, void_reason);
  end if;

  update public.orders
    set status = 'cancelled',
        payment_status = 'voided',
        updated_at = now()
    where id = target_order_id;

  perform public.log_staff_activity(
    'void', target_order_id, coalesce(void_reason, 'voided')
  );
end;
$$;

grant execute on function public.record_payment(uuid, text, numeric, text) to authenticated;
grant execute on function public.refund_payment(uuid, numeric, text) to authenticated;
grant execute on function public.void_order(uuid, text) to authenticated;

-- ============================================================================
-- 6. Floor management
-- ============================================================================
create or replace function public.set_order_table(target_order_id uuid, label text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_staff() then
    raise exception 'not authorized';
  end if;

  update public.orders
    set table_label = nullif(trim(coalesce(label, '')), ''),
        -- Seating a ticket makes it dine-in by definition; clearing the seat
        -- does not send it back to takeout, because it may have been dine-in
        -- with the table not yet chosen.
        order_type = case when nullif(trim(coalesce(label, '')), '') is not null
                          then 'dine_in' else order_type end,
        updated_at = now()
    where id = target_order_id;

  if not found then
    raise exception 'order not found';
  end if;

  perform public.log_staff_activity('table_assign', target_order_id, label);
end;
$$;

create or replace function public.set_order_priority(target_order_id uuid, new_priority integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_staff() then
    raise exception 'not authorized';
  end if;

  update public.orders
    set priority = greatest(0, least(9, coalesce(new_priority, 0))),
        updated_at = now()
    where id = target_order_id;

  if not found then
    raise exception 'order not found';
  end if;
end;
$$;

grant execute on function public.set_order_table(uuid, text) to authenticated;
grant execute on function public.set_order_priority(uuid, integer) to authenticated;

-- ============================================================================
-- 7. End-of-shift drawer report
-- ----------------------------------------------------------------------------
-- Sums the ledger over the shift window rather than the orders table, so a
-- refund issued during the shift lands in the same report as the payment it
-- reverses — which is the whole point of counting a drawer.
-- ============================================================================
create or replace function public.shift_report(target_shift_id uuid)
returns table (
  method text,
  payments_count bigint,
  payments_total numeric,
  refunds_total numeric,
  net_total numeric
)
language sql
security definer
set search_path = public
stable
as $$
  with window_bounds as (
    select s.started_at, coalesce(s.ended_at, now()) as ends_at
    from public.shifts s
    where s.id = target_shift_id
      and (s.staff_id = auth.uid() or public.is_admin())
  )
  select
    p.method,
    count(*) filter (where p.kind = 'payment')::bigint as payments_count,
    coalesce(sum(p.amount) filter (where p.kind = 'payment'), 0) as payments_total,
    coalesce(sum(p.amount) filter (where p.kind in ('refund', 'void')), 0) as refunds_total,
    coalesce(sum(p.amount) filter (where p.kind = 'payment'), 0)
      - coalesce(sum(p.amount) filter (where p.kind in ('refund', 'void')), 0) as net_total
  from public.payments p, window_bounds w
  where p.created_at >= w.started_at
    and p.created_at <= w.ends_at
  group by p.method
  order by p.method;
$$;

grant execute on function public.shift_report(uuid) to authenticated;

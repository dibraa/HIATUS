-- Repair the order columns required by the staff queue and fulfillment screens.
-- Safe to run on an existing database; every change is additive or idempotent.

alter table public.orders
  add column if not exists order_type text not null default 'takeout';

alter table public.orders drop constraint if exists orders_order_type_check;
alter table public.orders
  add constraint orders_order_type_check
  check (order_type in ('dine_in', 'takeout'));

alter table public.orders
  add column if not exists table_label text;

alter table public.orders
  add column if not exists priority integer not null default 0;

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

alter table public.orders
  add column if not exists subtotal_amount numeric(10, 2) not null default 0;

alter table public.orders
  add column if not exists discount_amount numeric(10, 2) not null default 0;

alter table public.orders
  add column if not exists promo_code text;

update public.orders
set subtotal_amount = total_amount
where subtotal_amount = 0
  and total_amount > 0
  and discount_amount = 0;

create index if not exists orders_queue_idx
  on public.orders (priority desc, created_at asc)
  where status in ('pending', 'preparing', 'ready');

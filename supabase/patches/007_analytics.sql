-- ============================================================================
-- 007 — Reporting: sales, peak hours, item popularity, customers, wait times
-- ----------------------------------------------------------------------------
-- WHY THIS EXISTS
--
-- Every function here is `security definer` and gates on `public.is_admin()`
-- inside its own WHERE clause, matching `best_selling_flavors` in schema.sql.
-- A non-admin calling one gets an empty result rather than an error — the
-- shape a report renderer can handle without a special case.
--
-- TIME ZONES. `created_at` is timestamptz, which is UTC underneath. "Which
-- hour is busiest" and "what did we take on Tuesday" are questions about the
-- SHOP's clock, so every function takes a `tz` argument and converts before
-- truncating. The default is Asia/Manila, matching the en-PH formatting the
-- app already uses. Truncating in UTC would smear a Manila morning across two
-- calendar days and shift every peak by eight hours.
--
-- WHAT COUNTS AS REVENUE. Completed orders only, and `total_amount` — which is
-- net of discount (see 004). Cancelled and pending orders are excluded because
-- a report the owner reconciles against a drawer must not count money that was
-- never taken.
--
-- Safe to run on an existing database. Re-running it is a no-op.
-- ============================================================================

-- ============================================================================
-- 1. Sales over time
-- ----------------------------------------------------------------------------
-- One function serves the daily, monthly and annual reports; `bucket` chooses
-- the grain. Three near-identical functions would be three places for the
-- revenue definition to drift.
--
-- generate_series fills empty buckets with zeroes rather than omitting them —
-- a chart with a missing Tuesday reads as "no data yet", not "we took nothing",
-- and those are very different facts for an owner.
-- ============================================================================
create or replace function public.sales_report(
  from_date date default null,
  to_date date default null,
  bucket text default 'day',
  tz text default 'Asia/Manila'
)
returns table (
  period timestamptz,
  order_count bigint,
  gross_amount numeric,
  discount_amount numeric,
  net_amount numeric,
  average_order_value numeric
)
language sql
security definer
set search_path = public
stable
as $$
  with params as (
    select
      case when bucket in ('day', 'week', 'month', 'year') then bucket else 'day' end as grain,
      coalesce(from_date, (now() at time zone tz)::date - interval '29 days') as starts,
      coalesce(to_date, (now() at time zone tz)::date) as ends
  ),
  buckets as (
    select generate_series(
      date_trunc((select grain from params), (select starts from params)::timestamp),
      date_trunc((select grain from params), (select ends from params)::timestamp),
      ('1 ' || (select grain from params))::interval
    ) as period
  ),
  scoped as (
    select
      date_trunc(
        (select grain from params),
        (o.created_at at time zone tz)
      ) as period,
      o.total_amount,
      o.discount_amount,
      o.subtotal_amount
    from public.orders o, params p
    where public.is_admin()
      and o.status = 'completed'
      and (o.created_at at time zone tz)::date >= p.starts
      and (o.created_at at time zone tz)::date <= p.ends
  )
  select
    (b.period at time zone tz) as period,
    count(s.total_amount)::bigint as order_count,
    coalesce(sum(s.subtotal_amount), 0) as gross_amount,
    coalesce(sum(s.discount_amount), 0) as discount_amount,
    coalesce(sum(s.total_amount), 0) as net_amount,
    -- Guarded division: an empty bucket must report 0, not divide by zero.
    case when count(s.total_amount) = 0 then 0
         else round(coalesce(sum(s.total_amount), 0) / count(s.total_amount), 2) end as average_order_value
  from buckets b
  left join scoped s on s.period = b.period
  where public.is_admin()
  group by b.period
  order by b.period;
$$;

grant execute on function public.sales_report(date, date, text, text) to authenticated;

-- ============================================================================
-- 2. Peak hours
-- ----------------------------------------------------------------------------
-- All 24 hours are always returned, including the closed ones. A bar chart of
-- only the busy hours has no baseline to read the busy ones against.
-- ============================================================================
create or replace function public.peak_hours(
  days_back integer default 30,
  tz text default 'Asia/Manila'
)
returns table (
  hour_of_day integer,
  order_count bigint,
  revenue numeric
)
language sql
security definer
set search_path = public
stable
as $$
  with hours as (select generate_series(0, 23) as hour_of_day),
  scoped as (
    select
      extract(hour from (o.created_at at time zone tz))::integer as hour_of_day,
      o.total_amount
    from public.orders o
    where public.is_admin()
      and o.status = 'completed'
      and (days_back is null or o.created_at >= now() - (days_back || ' days')::interval)
  )
  select
    h.hour_of_day,
    count(s.total_amount)::bigint as order_count,
    coalesce(sum(s.total_amount), 0) as revenue
  from hours h
  left join scoped s on s.hour_of_day = h.hour_of_day
  where public.is_admin()
  group by h.hour_of_day
  order by h.hour_of_day;
$$;

grant execute on function public.peak_hours(integer, text) to authenticated;

-- ============================================================================
-- 3. Item popularity
-- ----------------------------------------------------------------------------
-- Grouped by the NAME recorded on the line, not by menu_item_id. order_items
-- keeps item_name as a snapshot and nulls menu_item_id if the item is later
-- deleted; grouping by the id would drop every sale of a discontinued drink
-- out of the history that is supposed to explain why it was discontinued.
-- ============================================================================
create or replace function public.popular_items(
  days_back integer default 30,
  limit_count integer default 10
)
returns table (
  item_name text,
  flavor text,
  total_quantity bigint,
  total_revenue numeric,
  order_count bigint
)
language sql
security definer
set search_path = public
stable
as $$
  select
    oi.item_name,
    oi.flavor,
    sum(oi.quantity)::bigint as total_quantity,
    sum(oi.subtotal) as total_revenue,
    count(distinct oi.order_id)::bigint as order_count
  from public.order_items oi
  join public.orders o on o.id = oi.order_id
  where public.is_admin()
    and o.status = 'completed'
    and (days_back is null or o.created_at >= now() - (days_back || ' days')::interval)
  group by oi.item_name, oi.flavor
  order by sum(oi.quantity) desc
  limit greatest(1, coalesce(limit_count, 10));
$$;

grant execute on function public.popular_items(integer, integer) to authenticated;

-- ============================================================================
-- 4. Customer behaviour
-- ----------------------------------------------------------------------------
-- "New" means the customer's FIRST completed order falls inside the window,
-- not that their account was created in it. Someone who signed up in January
-- and finally ordered in March is a new customer in March, which is the month
-- whose marketing earned them.
-- ============================================================================
create or replace function public.customer_summary(days_back integer default 30)
returns table (
  total_customers bigint,
  new_customers bigint,
  returning_customers bigint,
  orders_per_customer numeric,
  average_spend numeric
)
language sql
security definer
set search_path = public
stable
as $$
  with first_order as (
    select user_id, min(created_at) as first_at
    from public.orders
    where status = 'completed'
    group by user_id
  ),
  scoped as (
    select o.user_id, count(*)::numeric as orders, sum(o.total_amount) as spend
    from public.orders o
    where public.is_admin()
      and o.status = 'completed'
      and (days_back is null or o.created_at >= now() - (days_back || ' days')::interval)
    group by o.user_id
  )
  select
    count(*)::bigint as total_customers,
    count(*) filter (
      where days_back is null
         or f.first_at >= now() - (days_back || ' days')::interval
    )::bigint as new_customers,
    count(*) filter (
      where days_back is not null
        and f.first_at < now() - (days_back || ' days')::interval
    )::bigint as returning_customers,
    case when count(*) = 0 then 0 else round(sum(s.orders) / count(*), 2) end as orders_per_customer,
    case when count(*) = 0 then 0 else round(sum(s.spend) / count(*), 2) end as average_spend
  from scoped s
  join first_order f on f.user_id = s.user_id
  where public.is_admin();
$$;

grant execute on function public.customer_summary(integer) to authenticated;

create or replace function public.top_customers(
  days_back integer default 30,
  limit_count integer default 10
)
returns table (
  user_id uuid,
  full_name text,
  phone text,
  order_count bigint,
  total_spend numeric,
  last_order_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select
    o.user_id,
    p.full_name,
    p.phone,
    count(*)::bigint as order_count,
    sum(o.total_amount) as total_spend,
    max(o.created_at) as last_order_at
  from public.orders o
  join public.profiles p on p.id = o.user_id
  where public.is_admin()
    and o.status = 'completed'
    and (days_back is null or o.created_at >= now() - (days_back || ' days')::interval)
  group by o.user_id, p.full_name, p.phone
  order by sum(o.total_amount) desc
  limit greatest(1, coalesce(limit_count, 10));
$$;

grant execute on function public.top_customers(integer, integer) to authenticated;

-- ============================================================================
-- 5. Wait times
-- ----------------------------------------------------------------------------
-- Measured created_at -> ready_at (added in 002), which is the wait the
-- customer actually experienced. Orders that predate that column, or that were
-- never marked ready, are excluded rather than counted as zero.
--
-- The customer-facing estimate reads this: a median from the last week beats a
-- hardcoded "10 minutes" on every day that is not average.
-- ============================================================================
create or replace function public.wait_time_stats(days_back integer default 7)
returns table (
  sample_size bigint,
  median_minutes numeric,
  average_minutes numeric,
  p90_minutes numeric
)
language sql
security definer
set search_path = public
stable
as $$
  with waits as (
    select extract(epoch from (o.ready_at - o.created_at)) / 60.0 as minutes
    from public.orders o
    where o.ready_at is not null
      and o.status in ('ready', 'completed')
      and (days_back is null or o.created_at >= now() - (days_back || ' days')::interval)
  )
  select
    count(*)::bigint,
    coalesce(round(percentile_cont(0.5) within group (order by minutes)::numeric, 1), 0),
    coalesce(round(avg(minutes)::numeric, 1), 0),
    coalesce(round(percentile_cont(0.9) within group (order by minutes)::numeric, 1), 0)
  from waits;
$$;

-- Not admin-gated: the customer's own order page shows "about N minutes", and
-- an aggregate over anonymous durations discloses nothing about any one order.
grant execute on function public.wait_time_stats(integer) to authenticated;
grant execute on function public.wait_time_stats(integer) to anon;

-- ============================================================================
-- 6. Today at a glance — the admin dashboard's header row
-- ----------------------------------------------------------------------------
-- One round trip for the four numbers the owner opens the dashboard to see.
-- Four separate queries would be four network hops for one card.
-- ============================================================================
create or replace function public.today_summary(tz text default 'Asia/Manila')
returns table (
  orders_today bigint,
  revenue_today numeric,
  pending_now bigint,
  preparing_now bigint,
  ready_now bigint,
  unpaid_now bigint
)
language sql
security definer
set search_path = public
stable
as $$
  select
    count(*) filter (
      where (o.created_at at time zone tz)::date = (now() at time zone tz)::date
        and o.status = 'completed'
    )::bigint,
    coalesce(sum(o.total_amount) filter (
      where (o.created_at at time zone tz)::date = (now() at time zone tz)::date
        and o.status = 'completed'
    ), 0),
    count(*) filter (where o.status = 'pending')::bigint,
    count(*) filter (where o.status = 'preparing')::bigint,
    count(*) filter (where o.status = 'ready')::bigint,
    count(*) filter (
      where o.payment_status = 'unpaid'
        and o.status not in ('cancelled')
    )::bigint
  from public.orders o
  where public.is_staff();
$$;

grant execute on function public.today_summary(text) to authenticated;

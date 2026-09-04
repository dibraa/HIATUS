-- ============================================================================
-- 002 — Staff role, activity log and shifts
-- ----------------------------------------------------------------------------
-- WHY THIS EXISTS
--
-- The app had two roles: customer and admin. A real counter needs a third.
-- Baristas must be able to work the order queue and mark drinks sold out, but
-- must NOT be able to edit prices, read revenue, or create accounts.
--
-- The rule this patch encodes throughout: an ADMIN can do everything a STAFF
-- member can, so authorisation asks `is_staff()` (staff OR admin) for counter
-- work and `is_admin()` for the books. Nothing checks `role = 'staff'`
-- directly, which is what would otherwise lock owners out of their own queue.
--
-- Column-level permission is deliberately NOT attempted in RLS — a Postgres
-- policy gates ROWS, not columns, so "staff may change is_available but not
-- price" cannot be a policy. It is an RPC instead (`set_item_availability`),
-- which is the same reason `create_order` exists.
--
-- Safe to run on an existing database: additive, and every function is
-- replaced rather than dropped. Re-running it is a no-op.
-- ============================================================================

-- ============================================================================
-- 1. The role itself
-- ============================================================================

-- The role check was written inline in schema.sql, so Postgres named it for
-- us. Drop by that generated name and re-add with the third role.
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('customer', 'staff', 'admin'));

-- Deactivation without demotion. Firing a barista and forgetting who they were
-- are different things: `is_active = false` revokes access while the row (and
-- therefore their name on past orders and shifts) survives.
alter table public.profiles
  add column if not exists is_active boolean not null default true;

comment on column public.profiles.is_active is
  'False revokes staff/admin access without deleting the account or its history.';

-- ============================================================================
-- 2. Authorisation helpers
-- ============================================================================

-- Security definer for the same reason is_admin() is: without it, a policy on
-- profiles that reads profiles recurses into itself.
create or replace function public.is_staff()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('staff', 'admin')
      and is_active
  );
$$;

comment on function public.is_staff() is
  'True for staff AND admins. Counter work checks this; the books check is_admin().';

-- is_admin() is redefined here only to add the is_active test, so a
-- deactivated admin loses access the moment the flag flips rather than at
-- their next login.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and is_active
  );
$$;

grant execute on function public.is_staff() to authenticated;

-- ============================================================================
-- 3. RLS — let staff see the counter, and nothing else
-- ============================================================================

-- Staff need the customer's name and phone to call an order out, so they get
-- read access to profiles. Note this is SELECT only: the existing
-- profiles_admin_manage policy still restricts writes to admins.
drop policy if exists "profiles_select_staff" on public.profiles;
create policy "profiles_select_staff"
  on public.profiles for select
  using (public.is_staff());

drop policy if exists "orders_select_own_or_admin" on public.orders;
create policy "orders_select_own_or_staff"
  on public.orders for select
  using (auth.uid() = user_id or public.is_staff());

drop policy if exists "order_items_select_own_or_admin" on public.order_items;
create policy "order_items_select_own_or_staff"
  on public.order_items for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_items.order_id
        and (o.user_id = auth.uid() or public.is_staff())
    )
  );

-- ============================================================================
-- 4. Staff activity log — an audit trail admins can read
-- ============================================================================
create table if not exists public.staff_activity (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.profiles (id) on delete cascade,
  -- Free text rather than an enum: an audit log that rejects an unforeseen
  -- action type would rather lose the record than accept it, which is exactly
  -- backwards for an audit log.
  action text not null,
  subject_id uuid,
  detail text,
  created_at timestamptz not null default now()
);

create index if not exists staff_activity_created_idx
  on public.staff_activity (created_at desc);
create index if not exists staff_activity_staff_idx
  on public.staff_activity (staff_id, created_at desc);

alter table public.staff_activity enable row level security;

-- Staff can see their own trail; only admins see everyone's.
drop policy if exists "staff_activity_select" on public.staff_activity;
create policy "staff_activity_select"
  on public.staff_activity for select
  using (staff_id = auth.uid() or public.is_admin());

-- No insert policy: rows are written only by the security-definer function
-- below, so an entry cannot be forged or back-dated by a client.

create or replace function public.log_staff_activity(
  action text,
  subject_id uuid default null,
  detail text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return;
  end if;

  insert into public.staff_activity (staff_id, action, subject_id, detail)
  values (auth.uid(), action, subject_id, detail);
end;
$$;

-- ============================================================================
-- 5. Order status transitions move from admin-only to staff-or-admin
-- ============================================================================

-- When the drink was actually announced. `updated_at` cannot answer this: it
-- moves on every later edit, so it says when the row last changed, not when
-- the customer's wait ended. The wait-time estimate in patch 007 is measured
-- from created_at to this, so it needs its own column.
alter table public.orders
  add column if not exists ready_at timestamptz;

comment on column public.orders.ready_at is
  'First time the order reached status=ready. Never overwritten; drives wait-time stats.';

create or replace function public.update_order_status(target_order_id uuid, new_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  previous_status text;
begin
  if not public.is_staff() then
    raise exception 'not authorized';
  end if;

  if new_status not in ('pending', 'preparing', 'ready', 'completed', 'cancelled') then
    raise exception 'invalid status %', new_status;
  end if;

  select status into previous_status from public.orders where id = target_order_id;

  if previous_status is null then
    raise exception 'order not found';
  end if;

  -- No-op rather than an error: two baristas pressing "Ready" on the same
  -- ticket is a race, not a mistake, and the second one should not see a
  -- failure for arriving a moment later.
  if previous_status = new_status then
    return;
  end if;

  update public.orders
    set status = new_status,
        updated_at = now(),
        -- Stamped once, the first time the drink is announced. This is what
        -- the wait-time estimate in 007 is measured against, so it must not be
        -- overwritten if an order bounces back to preparing and forward again.
        ready_at = case
          when new_status = 'ready' and ready_at is null then now()
          else ready_at
        end
    where id = target_order_id;

  perform public.log_staff_activity(
    'order_status',
    target_order_id,
    format('%s -> %s', previous_status, new_status)
  );
end;
$$;

grant execute on function public.update_order_status(uuid, text) to authenticated;

-- ============================================================================
-- 6. Menu availability — the one menu write staff are allowed
-- ============================================================================
create or replace function public.set_item_availability(
  target_item_id uuid,
  available boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  item_name text;
begin
  if not public.is_staff() then
    raise exception 'not authorized';
  end if;

  update public.menu_items
    set is_available = available
    where id = target_item_id
    returning name into item_name;

  if item_name is null then
    raise exception 'menu item not found';
  end if;

  perform public.log_staff_activity(
    'menu_availability',
    target_item_id,
    format('%s marked %s', item_name, case when available then 'available' else 'sold out' end)
  );
end;
$$;

grant execute on function public.set_item_availability(uuid, boolean) to authenticated;

-- ============================================================================
-- 7. Shifts — clock in/out and the end-of-shift drawer report
-- ============================================================================
create table if not exists public.shifts (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.profiles (id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  opening_cash numeric(10, 2) not null default 0 check (opening_cash >= 0),
  closing_cash numeric(10, 2) check (closing_cash >= 0),
  note text
);

-- One open shift per person. A partial unique index is what makes "you are
-- already clocked in" a database guarantee rather than a check the app
-- performs and a double-tap defeats.
create unique index if not exists shifts_one_open_per_staff
  on public.shifts (staff_id)
  where ended_at is null;

create index if not exists shifts_started_idx on public.shifts (started_at desc);

alter table public.shifts enable row level security;

drop policy if exists "shifts_select" on public.shifts;
create policy "shifts_select"
  on public.shifts for select
  using (staff_id = auth.uid() or public.is_admin());

create or replace function public.clock_in(opening numeric default 0)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_shift_id uuid;
begin
  if not public.is_staff() then
    raise exception 'not authorized';
  end if;

  insert into public.shifts (staff_id, opening_cash)
  values (auth.uid(), coalesce(opening, 0))
  returning id into new_shift_id;

  perform public.log_staff_activity('shift_start', new_shift_id, 'clocked in');
  return new_shift_id;
exception
  -- The partial unique index above is the real guard; this turns its raw
  -- constraint error into something the UI can show a person.
  when unique_violation then
    raise exception 'you are already clocked in';
end;
$$;

create or replace function public.clock_out(closing numeric default null, shift_note text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_shift_id uuid;
begin
  if not public.is_staff() then
    raise exception 'not authorized';
  end if;

  update public.shifts
    set ended_at = now(),
        closing_cash = closing,
        note = shift_note
    where staff_id = auth.uid() and ended_at is null
    returning id into target_shift_id;

  if target_shift_id is null then
    raise exception 'you are not clocked in';
  end if;

  perform public.log_staff_activity('shift_end', target_shift_id, 'clocked out');
end;
$$;

grant execute on function public.clock_in(numeric) to authenticated;
grant execute on function public.clock_out(numeric, text) to authenticated;

-- ============================================================================
-- 8. Admin: promote, demote and deactivate accounts
-- ----------------------------------------------------------------------------
-- Creating an auth user needs the Auth admin API and a service-role key, which
-- has no business being in a Next.js server action reachable from the browser.
-- So the flow is: the person signs up through the app like anyone else, and an
-- admin grants them the role here. It is one extra step and it never puts a
-- god-mode key in the application.
-- ============================================================================
create or replace function public.set_user_role(target_email text, new_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_id uuid;
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  if new_role not in ('customer', 'staff', 'admin') then
    raise exception 'invalid role %', new_role;
  end if;

  select id into target_id from auth.users where lower(email) = lower(trim(target_email));

  if target_id is null then
    raise exception 'no account found for %. They need to sign up first.', target_email;
  end if;

  -- An admin demoting themselves would lock the shop out of its own admin
  -- area, with no way back in through the UI.
  if target_id = auth.uid() and new_role <> 'admin' then
    raise exception 'you cannot change your own admin role';
  end if;

  update public.profiles set role = new_role where id = target_id;

  perform public.log_staff_activity(
    'role_change', target_id, format('%s set to %s', target_email, new_role)
  );
end;
$$;

create or replace function public.set_user_active(target_id uuid, active boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  if target_id = auth.uid() then
    raise exception 'you cannot deactivate your own account';
  end if;

  update public.profiles set is_active = active where id = target_id;

  if not found then
    raise exception 'account not found';
  end if;

  perform public.log_staff_activity(
    'account_active', target_id,
    case when active then 'reactivated' else 'deactivated' end
  );
end;
$$;

grant execute on function public.set_user_role(text, text) to authenticated;
grant execute on function public.set_user_active(uuid, boolean) to authenticated;

-- ============================================================================
-- 9. Staff directory — profiles joined to the email that identifies them
-- ----------------------------------------------------------------------------
-- auth.users is not readable under RLS, so the admin staff list cannot show an
-- email by joining from the client. This function is the seam.
-- ============================================================================
create or replace function public.list_team()
returns table (
  id uuid,
  email text,
  full_name text,
  phone text,
  role text,
  is_active boolean,
  created_at timestamptz,
  on_shift boolean
)
language sql
security definer
set search_path = public
stable
as $$
  select
    p.id,
    u.email::text,
    p.full_name,
    p.phone,
    p.role,
    p.is_active,
    p.created_at,
    exists (
      select 1 from public.shifts s
      where s.staff_id = p.id and s.ended_at is null
    ) as on_shift
  from public.profiles p
  join auth.users u on u.id = p.id
  where public.is_admin()
    and p.role in ('staff', 'admin')
  order by p.role, p.full_name nulls last;
$$;

grant execute on function public.list_team() to authenticated;

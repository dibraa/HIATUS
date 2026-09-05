-- Re-publish the team directory RPC for databases where the staff migration
-- was applied before the function was added or the PostgREST schema cache lagged.
create table if not exists public.shifts (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.profiles (id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  opening_cash numeric(10, 2) not null default 0 check (opening_cash >= 0),
  closing_cash numeric(10, 2) check (closing_cash >= 0),
  note text
);

create unique index if not exists shifts_one_open_per_staff
  on public.shifts (staff_id)
  where ended_at is null;

create index if not exists shifts_started_idx
  on public.shifts (started_at desc);

alter table public.shifts enable row level security;

drop policy if exists "shifts_select" on public.shifts;
create policy "shifts_select"
  on public.shifts for select
  using (staff_id = auth.uid() or public.is_admin());

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
      select 1
      from public.shifts s
      where s.staff_id = p.id and s.ended_at is null
    ) as on_shift
  from public.profiles p
  join auth.users u on u.id = p.id
  where public.is_admin()
    and p.role in ('staff', 'admin')
  order by p.role, p.full_name nulls last;
$$;

grant execute on function public.list_team() to authenticated;

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

  select id
    into target_id
    from auth.users
   where lower(email) = lower(trim(target_email));

  if target_id is null then
    raise exception 'no account found for %. They need to sign up first.', target_email;
  end if;

  if target_id = auth.uid() and new_role <> 'admin' then
    raise exception 'you cannot change your own admin role';
  end if;

  update public.profiles
     set role = new_role
   where id = target_id;

  if not found then
    raise exception 'profile not found for %', target_email;
  end if;

  if to_regclass('public.staff_activity') is not null then
    insert into public.staff_activity (staff_id, action, subject_id, detail)
    values (auth.uid(), 'role_change', target_id, format('%s set to %s', target_email, new_role));
  end if;
end;
$$;

grant execute on function public.set_user_role(text, text) to authenticated;
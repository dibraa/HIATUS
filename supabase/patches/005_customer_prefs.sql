-- ============================================================================
-- 005 — Favourites, saved order presets, notification preferences
-- ----------------------------------------------------------------------------
-- WHY THIS EXISTS
--
-- Everything here is a customer's own data, so the RLS is uniform and simple:
-- `user_id = auth.uid()` for every verb. No security-definer functions are
-- needed — nothing in this patch involves a price, a role, or another person's
-- row, which is the only reason the RPCs elsewhere exist.
--
-- Safe to run on an existing database. Re-running it is a no-op.
-- ============================================================================

-- ============================================================================
-- 0. Capture the phone number given at signup
-- ----------------------------------------------------------------------------
-- The signup form offers an optional phone number, and `signUp` passes it in
-- the auth user's metadata. The original trigger only read `full_name`, so the
-- number was accepted by the form and then silently dropped.
--
-- It has to be the TRIGGER that reads it, not a follow-up update from the
-- server action: the profile row is created by this trigger the moment the
-- auth user is inserted, and a second write from the app would race it.
--
-- `nullif(..., '')` because an untouched optional field arrives as an empty
-- string, and "" is not the same as "no phone number" — one of them sorts and
-- displays as a blank value forever.
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'phone'), '')
  );
  return new;
end;
$$;

-- ============================================================================
-- 1. Favourites
-- ============================================================================
create table if not exists public.favorites (
  user_id uuid not null references public.profiles (id) on delete cascade,
  menu_item_id uuid not null references public.menu_items (id) on delete cascade,
  created_at timestamptz not null default now(),
  -- Composite key rather than a surrogate id: "this person favourited this
  -- drink" is the identity, and it makes a double-tap a no-op upsert instead
  -- of a duplicate row.
  primary key (user_id, menu_item_id)
);

alter table public.favorites enable row level security;

drop policy if exists "favorites_own" on public.favorites;
create policy "favorites_own"
  on public.favorites for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ============================================================================
-- 2. Saved order presets ("my usual")
-- ----------------------------------------------------------------------------
-- The lines are jsonb, in the same shape create_order accepts, so reordering a
-- preset is the ordinary checkout path with a pre-filled cart — not a second
-- pricing route that could disagree with the first.
--
-- Prices are deliberately NOT stored. A preset saved in March must be charged
-- at today's menu price, and create_order re-derives every line anyway.
-- ============================================================================
create table if not exists public.order_presets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  lines jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists order_presets_user_idx on public.order_presets (user_id);

alter table public.order_presets enable row level security;

drop policy if exists "order_presets_own" on public.order_presets;
create policy "order_presets_own"
  on public.order_presets for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ============================================================================
-- 3. Notification preferences
-- ----------------------------------------------------------------------------
-- One row per customer, created on demand rather than by a trigger: a row that
-- has never been written should read as "all defaults", and the app's upsert
-- handles that without every signup paying for an extra insert.
-- ============================================================================
create table if not exists public.notification_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  -- Order progress is the reason someone gave us their contact details, so it
  -- defaults on. Marketing defaults OFF — opt-in, not opt-out.
  order_updates boolean not null default true,
  ready_alerts boolean not null default true,
  promotions boolean not null default false,
  email_channel boolean not null default true,
  sms_channel boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.notification_preferences enable row level security;

drop policy if exists "notification_preferences_own" on public.notification_preferences;
create policy "notification_preferences_own"
  on public.notification_preferences for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ============================================================================
-- 4. Favourites with their menu row, in one round trip
-- ----------------------------------------------------------------------------
-- A plain PostgREST embed would work here; this exists so the favourites page
-- and the "your usual" strip on the home page ask the same question the same
-- way, including the availability flag that decides whether the card is
-- buyable.
-- ============================================================================
create or replace function public.my_favorites()
returns table (
  menu_item_id uuid,
  name text,
  description text,
  flavor text,
  category text,
  price numeric,
  image_url text,
  is_available boolean,
  favorited_at timestamptz
)
language sql
security invoker
set search_path = public
stable
as $$
  select
    m.id,
    m.name,
    m.description,
    m.flavor,
    m.category,
    m.price,
    m.image_url,
    m.is_available,
    f.created_at
  from public.favorites f
  join public.menu_items m on m.id = f.menu_item_id
  where f.user_id = auth.uid()
  order by f.created_at desc;
$$;

-- security invoker, not definer: RLS on favorites already restricts this to
-- the caller's own rows, and menu_items is publicly readable. Escalating
-- privileges here would buy nothing and widen the surface.
grant execute on function public.my_favorites() to authenticated;

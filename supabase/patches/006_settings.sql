-- ============================================================================
-- 006 — System settings: business hours, payment methods, notification copy
-- ----------------------------------------------------------------------------
-- WHY THIS EXISTS
--
-- A key/value table with a jsonb value, not a one-row table with a column per
-- setting. Adding "do we accept GCash" should be an INSERT the admin screen
-- performs, not a migration — and settings are read as a whole and written one
-- at a time, which is exactly what a KV table is good at.
--
-- Everything here is world-readable by design: opening hours and accepted
-- payment methods are things the storefront must show a logged-out visitor.
-- Nothing secret goes in this table.
--
-- Safe to run on an existing database. Re-running it is a no-op — the seeds
-- below are `on conflict do nothing`, so an edited setting is never reverted.
-- ============================================================================

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;

drop policy if exists "app_settings_public_read" on public.app_settings;
create policy "app_settings_public_read"
  on public.app_settings for select
  using (true);

drop policy if exists "app_settings_admin_write" on public.app_settings;
create policy "app_settings_admin_write"
  on public.app_settings for all
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================================
-- Seeds
-- ============================================================================

-- Business hours. Day 0 is Sunday, matching JavaScript's Date#getDay() so the
-- client never has to remap the index. `closed` is explicit rather than
-- implied by equal open/close times, which would be ambiguous.
insert into public.app_settings (key, value) values (
  'business_hours',
  '[
    {"day": 0, "label": "Sunday",    "open": "08:00", "close": "18:00", "closed": false},
    {"day": 1, "label": "Monday",    "open": "07:00", "close": "20:00", "closed": false},
    {"day": 2, "label": "Tuesday",   "open": "07:00", "close": "20:00", "closed": false},
    {"day": 3, "label": "Wednesday", "open": "07:00", "close": "20:00", "closed": false},
    {"day": 4, "label": "Thursday",  "open": "07:00", "close": "20:00", "closed": false},
    {"day": 5, "label": "Friday",    "open": "07:00", "close": "22:00", "closed": false},
    {"day": 6, "label": "Saturday",  "open": "08:00", "close": "22:00", "closed": false}
  ]'::jsonb
) on conflict (key) do nothing;

-- Which tenders the checkout offers. Turning one off here removes it from the
-- customer's choices without a deploy.
insert into public.app_settings (key, value) values (
  'payment_methods',
  '{"cash": true, "card": true, "ewallet": true}'::jsonb
) on conflict (key) do nothing;

-- Shop identity, shown in the footer and on receipts.
insert into public.app_settings (key, value) values (
  'shop_info',
  '{
    "name": "Hiatus Coffee",
    "tagline": "Slow moments, served warm.",
    "address": "",
    "phone": "",
    "email": ""
  }'::jsonb
) on conflict (key) do nothing;

-- Operational knobs the queue and the customer's wait estimate both read.
insert into public.app_settings (key, value) values (
  'ordering',
  '{
    "accepting_orders": true,
    "default_prep_minutes": 10,
    "dine_in_enabled": true,
    "takeout_enabled": true
  }'::jsonb
) on conflict (key) do nothing;

-- Notification templates. Kept as data so the wording can be changed by the
-- shop rather than by a developer.
insert into public.app_settings (key, value) values (
  'notification_templates',
  '{
    "order_accepted": "We have your order and will start it shortly.",
    "order_preparing": "Your order is being made now.",
    "order_ready": "Your order is ready on the counter.",
    "order_completed": "Thanks for ordering — see you next time."
  }'::jsonb
) on conflict (key) do nothing;

-- ============================================================================
-- Writer
-- ----------------------------------------------------------------------------
-- The admin_write policy above already covers this, so the function exists for
-- one reason: to keep `updated_at` honest on an upsert. A policy cannot do
-- that, and leaving it to the client means the timestamp is whatever the
-- client claims.
-- ============================================================================
create or replace function public.set_setting(setting_key text, setting_value jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  insert into public.app_settings (key, value, updated_at)
  values (setting_key, setting_value, now())
  on conflict (key) do update
    set value = excluded.value,
        updated_at = now();

  perform public.log_staff_activity('setting_change', null, setting_key);
end;
$$;

grant execute on function public.set_setting(text, jsonb) to authenticated;

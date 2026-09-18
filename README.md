# Hiatus

Order-ahead coffee shop system built with Next.js (App Router) and Supabase, with
three roles — **customer**, **staff** and **admin** — sharing one design system.

Customers browse, customise and order; staff work a live queue, take payment and
run their shift; admins manage the menu, the team, promotions, settings and the
reports.

## Stack

- Next.js 16 (App Router, TypeScript, Server Actions)
- Supabase (Postgres, Auth, Storage) via `@supabase/ssr`
- Tailwind CSS v4 (design tokens via `@theme inline`)
- Recharts (admin analytics)

## Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com).
2. **Run the SQL, in order**, in the Supabase SQL editor:

   | File | What it adds |
   | --- | --- |
   | [`supabase/schema.sql`](supabase/schema.sql) | Base tables, RLS, `create_order` / `cancel_order` / `update_order_status`, `menu-images` bucket |
   | [`supabase/patches/001_size_pricing.sql`](supabase/patches/001_size_pricing.sql) | `order_items.size` and size-aware pricing |
   | [`supabase/patches/002_staff_role.sql`](supabase/patches/002_staff_role.sql) | The `staff` role, `is_staff()`, activity log, shifts, `orders.ready_at` |
   | [`supabase/patches/003_order_fulfillment.sql`](supabase/patches/003_order_fulfillment.sql) | Dine-in/takeout, tables, queue priority, the `payments` ledger |
   | [`supabase/patches/004_promotions.sql`](supabase/patches/004_promotions.sql) | Promo codes, order discounts, the final `create_order` |
   | [`supabase/patches/005_customer_prefs.sql`](supabase/patches/005_customer_prefs.sql) | Favourites, saved presets, notification preferences |
   | [`supabase/patches/006_settings.sql`](supabase/patches/006_settings.sql) | `app_settings` (hours, tenders, shop info, message wording) |
   | [`supabase/patches/007_analytics.sql`](supabase/patches/007_analytics.sql) | Sales, peak hours, popularity, customer and wait-time reporting |
   | [`supabase/patches/008_team_directory.sql`](supabase/patches/008_team_directory.sql) | `shifts` and a re-published `list_team()` for databases where 002 landed before the function existed |
   | [`supabase/patches/009_order_queue_columns.sql`](supabase/patches/009_order_queue_columns.sql) | Repairs the `orders` columns the staff queue needs — `order_type`, `table_label`, `priority`, `payment_method`, `payment_status` |

   Order matters — 004 replaces a function 001 created, and several patches call
   `log_staff_activity` from 002. Each file is additive and safe to re-run.

   008 and 009 are **repairs**, written after 002 and 003 were applied to a
   database that ended up missing pieces of them. On a fresh project they are
   no-ops; run them anyway, because a staff queue without `order_type` fails at
   the first ticket rather than at deploy.

   > ⚠ **004 drops `create_order(jsonb, text)`** and replaces it with a wider
   > signature. That is deliberate: keeping both would make a two-argument call
   > ambiguous and fail at runtime rather than at deploy.

3. **Set env vars**: copy `.env.local.example` to `.env.local` and fill in your
   project URL and anon key (Project Settings → API).
4. **Install and run**:
   ```bash
   npm install
   npm run dev
   ```
5. **Make yourself an admin**. There is no public "become admin" flow by design:
   ```sql
   update public.profiles set role = 'admin'
     where id = (select id from auth.users where email = 'you@example.com');
   ```
6. **Add menu items** at `/admin/menu`. Each needs a `flavor` and a `category` —
   both drive the storefront filters, and flavour drives the best-seller report.

## Roles

Authority is **cumulative**: an admin can do everything a staff member can. Counter
work asks `is_staff()` (true for both); the books ask `is_admin()`. Nothing
compares `role === 'staff'` directly — that test reads as "is this person on the
counter" but means "is this person not the owner", and it is how an owner ends up
locked out of their own queue.

| | Customer | Staff | Admin |
| --- | --- | --- | --- |
| Order, track, rate, save favourites | ✅ | ✅ | ✅ |
| Order queue, mark sold out, assign tables | | ✅ | ✅ |
| Take payment, refund, void, manual discount | | ✅ | ✅ |
| Clock in/out, drawer report | | ✅ | ✅ |
| Menu CRUD, team, promos, settings, reports | | | ✅ |

Access is enforced in **three** places, so a gap in one does not open the others:

1. `src/proxy.ts` → `src/lib/supabase/middleware.ts` — the request-time gate.
2. Each area's `layout.tsx` — a Server Component redirect.
3. Postgres RLS and every `security definer` RPC — the only one that stops a
   crafted request straight to the API.

Staff accounts are **not** created in-app. Creating an `auth.users` row needs the
service-role key, which bypasses every RLS policy and has no business in a server
action. Instead the person signs up normally and an admin grants the role at
`/admin/team`.

## Routes

**Customer** — `/` (hero, menu, why-us, story, hours) · `/menu/[id]` · `/cart` ·
`/checkout` · `/orders` · `/orders/[id]` · `/favorites` · `/profile` · `/login` ·
`/signup` · `/forgot-password` · `/reset-password`

**Staff** — `/staff` (queue) · `/staff/pos` · `/staff/menu` · `/staff/shift`

**Admin** — `/admin` (dashboard) · `/admin/orders` · `/admin/menu` ·
`/admin/promos` · `/admin/reports` · `/admin/team` · `/admin/settings`

## How it works

- **Pricing is server-derived, always.** The cart lives in `localStorage`, but
  checkout sends *choices* — item, size, code — never prices. `create_order`
  re-derives every line from the menu and every discount from `evaluate_promo`.
  `orders.total_amount` keeps its meaning (what the customer pays); the new
  `subtotal_amount` and `discount_amount` sit alongside it.
- **Promos have one implementation.** Checkout calls `evaluate_promo` to *preview*
  a discount and `create_order` calls the same function to *apply* one, so the
  quote and the charge cannot disagree.
- **Money is a ledger, not a flag.** `payments` is append-only; a refund is a new
  row, not the erasure of the payment it reverses. `orders.payment_status` is a
  cached rollup of it. That is what makes "reconcile the drawer" answerable.
- **The queue polls rather than subscribing.** `AutoRefresh` calls
  `router.refresh()` on an interval, pausing while the tab is hidden. A websocket
  would be a few seconds fresher at the cost of a second data path with its own
  auth and reconnect behaviour.
- **Reports are timezone-aware.** `created_at` is UTC underneath, so every
  reporting function takes a `tz` (default `Asia/Manila`) and converts before
  truncating. Truncating in UTC would shift every "peak hour" by eight hours.
- **Ratings stay verified.** RLS only accepts a rating from someone with a
  *completed* order containing that item.

## Design system

Everything is built on CSS custom properties at the top of
[`src/app/globals.css`](src/app/globals.css), exposed to Tailwind through
`@theme inline`. No component hardcodes a palette class.

**The brand is the PineBrew palette**: forest green `#2d5016`, burnt orange
`#c87137`, cream `#f5ead8`, charcoal `#1a1a1a`.

Two of those four cannot be used naively, and the tokens encode the fix rather
than leaving it to each component:

- **White on burnt orange is 3.58:1** — below the 4.5:1 WCAG 2.1 AA needs for
  text. So `--hi-accent-fg` is **charcoal** (4.87:1). Primary buttons are orange
  with charcoal text.
- **Burnt orange as text on cream is 3.00:1** — also below AA. Inline links and
  active labels use `--hi-accent-ink` (`#964a1c`, 5.36:1), a deepened member of
  the same hue family. **Never set text in `--hi-accent`.**
- **Hover lightens rather than darkens.** Darkening the orange would drop
  charcoal-on-orange below AA *while being interacted with*.
- **Orange on forest green is 2.59:1** and is never used. A CTA on an inverted
  panel uses the `inverse` button variant, which is why that variant exists.

Every ratio in `globals.css` is computed, not estimated. Dark mode is not the
light ramp inverted: cream becomes the *text* colour, and both brand hues move to
the lighter end of their families (caramel and sage) because forest green is
unreadable on a dark ground.

The **checkered pattern** is the brand's decorative signature — two 45° gradients
offset by half a tile, scaled by `--hi-checker-size`. Use `<CheckerBand />`, which
gets `aria-hidden` and the right pattern colour for its surface.

### Shared components

Reach for these before writing markup:

| Component | What it is for |
| --- | --- |
| [`ui/button.tsx`](src/components/ui/button.tsx) | `Button` / `ButtonLink`. Variants: `primary` (orange), `secondary` (green), `outline`, `ghost`, `inverse`, `danger`. |
| [`ui/field.tsx`](src/components/ui/field.tsx) | `TextField`, `TextAreaField`, `SelectField`, `CheckboxField`, `FormError`, `FormSuccess`. Labels, `aria-describedby` and announced errors are wired in, not optional. |
| [`ui/page-header.tsx`](src/components/ui/page-header.tsx) | Page title + description + action. `as` sets heading LEVEL separately from size. |
| [`ui/filter-tabs.tsx`](src/components/ui/filter-tabs.tsx) | Link-based segmented filters — each state is a URL. |
| [`ui/stat-card.tsx`](src/components/ui/stat-card.tsx) | `StatCard` / `StatGrid` — the dashboards' unit. |
| [`ui/empty-state.tsx`](src/components/ui/empty-state.tsx) | Says what happened *and* offers the way out. |
| [`ui/badge.tsx`](src/components/ui/badge.tsx) | Facts about a row (role, tender, promo state). Order status has its own component. |
| [`ui/checker.tsx`](src/components/ui/checker.tsx) | The checkered rule, with the correct colour per surface. |
| [`ui/product-image.tsx`](src/components/ui/product-image.tsx) | Fixed aspect ratio with a real placeholder — no layout shift. |
| [`lib/use-token-colors.ts`](src/lib/use-token-colors.ts) | Resolves `--hi-*` tokens to hex for Recharts, which writes `fill` as an SVG attribute and cannot hold `var()`. |
| [`lib/roles.ts`](src/lib/roles.ts) | `isStaff()` / `isAdmin()` and the route prefixes. |
| [`lib/order-meta.ts`](src/lib/order-meta.ts) | Every word the app uses for an order's facts. The DB stores `dine_in`; nobody sees that string. |
| [`lib/csv.ts`](src/lib/csv.ts) | RFC 4180 export, including formula-injection guarding. |

## Current scope

Payment is **recorded, not processed** — the app tracks what was taken on your own
terminal or in cash, and there is no payment gateway integration. Notification
preferences are stored and honoured by the UI, but email/SMS delivery is not
wired up. Both are natural next additions.

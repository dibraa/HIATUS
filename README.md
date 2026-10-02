# Hiatus

Order-ahead coffee shop system built with Next.js (App Router), Express and MongoDB,
with three roles — **customer**, **staff** and **admin** — sharing one design system.

Customers browse, customise and order; staff work a live queue, take payment and
run their shift; admins manage the menu, the team, settings and reports.

## Stack

- Next.js 16 (App Router, TypeScript, Server Actions)
- Express and MongoDB (Mongoose) API in `../server`
- Tailwind CSS v4 (design tokens via `@theme inline`)
- Recharts (admin analytics)

## Setup

1. **Configure the API**: copy `server/.env.example` to `server/.env` and set
  `MONGO_URI`, `JWT_SECRET`, `PORT` and `CLIENT_URL`.
2. **Configure the frontend**: copy `HIATUS/.env.local.example` to
   `HIATUS/.env.local` and fill it in. Each setting is explained in the file.
   - `JWT_SECRET` **must equal** the one in `server/.env`. In production the
     app refuses to start without it, rather than accept tokens anyone could
     forge.
   - Browser push stays off (`NEXT_PUBLIC_PUSH_ENABLED=false`) until the API
     has the routes in `docs/push-notifications-backend.md`.
3. **Install and run the API**:
  ```bash
  cd server
  npm install
  npm run dev
  ```
4. **Install and run the frontend** in a second terminal:
   ```bash
  cd HIATUS
   npm install
   npm run dev
   ```
5. **Make yourself an admin** by updating the user's `role` to `admin` in MongoDB.
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
| Menu CRUD, team, settings, reports | | | ✅ |

Access is enforced in three places:

1. `src/proxy.ts` — the request-time gate.
2. Each area's `layout.tsx` — a Server Component redirect.
3. Express JWT middleware and role checks — the API boundary.

Staff accounts are created by signing up normally; an admin grants the role at
`/admin/team`.

## Routes

**Customer** — `/` (hero, menu, why-us, story, hours) · `/menu/[id]` · `/cart` ·
`/checkout` · `/orders` · `/orders/[id]` · `/favorites` · `/profile` · `/login` ·
`/signup` · `/forgot-password` · `/reset-password`

**Staff** — `/staff` (queue) · `/staff/pos` · `/staff/menu` · `/staff/shift`

**Admin** — `/admin` (dashboard) · `/admin/orders` · `/admin/menu` ·
`/admin/reports` · `/admin/team` · `/admin/settings`

## How it works

- **Pricing is server-derived, always.** The cart lives in `localStorage`, but
  checkout sends *choices* — item and size — never prices. The API re-derives
  every line from the menu. Staff may apply manual discounts at the counter;
  `orders.total_amount` remains the amount the customer pays.
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

**The brand is the PineBrew palette**: pine green `#3e6b53`, burnt orange
`#c87137`, cream `#efe9de`, charcoal `#14120f`. The deeper cream `#f5ead8`
survives as `--hi-inverse-fg` — the text colour on pine, not a background.

Two of those four cannot be used naively, and the tokens encode the fix rather
than leaving it to each component:

- **White on burnt orange is 3.58:1** — below the 4.5:1 WCAG 2.1 AA needs for
  text. So `--hi-accent-fg` is **charcoal** (4.99:1). Primary buttons are orange
  with charcoal text.
- **Burnt orange as text on cream is 3.01:1** — also below AA. Inline links and
  active labels use `--hi-accent-ink` (`#964a1c`, 5.28:1 on surface, 6.19:1 on
  card), a deepened member of the same hue family. **Never set text in
  `--hi-accent`.**
- **Hover lightens rather than darkens.** Darkening the orange would drop
  charcoal-on-orange below AA *while being interacted with*.
- **Orange on pine green is 1.71:1** and is never used — the softer pine made
  this pair worse, not better. A CTA on an inverted panel uses the `inverse`
  button variant, which is why that variant exists.

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
| [`ui/badge.tsx`](src/components/ui/badge.tsx) | Facts about a row (role, tender, attention state). Order status has its own component. |
| [`ui/checker.tsx`](src/components/ui/checker.tsx) | The checkered rule, with the correct colour per surface. |
| [`ui/product-image.tsx`](src/components/ui/product-image.tsx) | Fixed aspect ratio with a real placeholder — no layout shift. |
| [`lib/use-token-colors.ts`](src/lib/use-token-colors.ts) | Resolves `--hi-*` tokens to hex for Recharts, which writes `fill` as an SVG attribute and cannot hold `var()`. |
| [`lib/roles.ts`](src/lib/roles.ts) | `isStaff()` / `isAdmin()` / `isStaffOnly()`, `homePathFor()` and the route prefixes. `isStaffOnly()` is the one *narrowing* test — it asks "is this person staff and not an admin", and exists so the nav can hide customer links from someone who is only working the counter. |
| [`lib/order-meta.ts`](src/lib/order-meta.ts) | Every word the app uses for an order's facts. The DB stores `dine_in`; nobody sees that string. |
| [`lib/csv.ts`](src/lib/csv.ts) | RFC 4180 export, including formula-injection guarding. |

## Current scope

Payment is **recorded, not processed** — the app tracks what was taken on your own
terminal or in cash, and there is no payment gateway integration. Notification
preferences are stored and honoured by the UI, but email/SMS delivery is not
wired up. Both are natural next additions.

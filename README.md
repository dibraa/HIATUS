# Hiatus

Online ordering + customer accounts for Hiatus coffee shop, built with Next.js (App
Router) and Supabase. Cash-on-pickup checkout, star ratings/reviews, and an admin
dashboard with a best-selling-flavor analytics view.

## Stack

- Next.js 16 (App Router, TypeScript, Server Actions)
- Supabase (Postgres, Auth, Storage) via `@supabase/ssr`
- Tailwind CSS
- Recharts (admin analytics chart)

## One-time setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com) (free tier is fine).
2. **Run the schema**: open the SQL editor in your Supabase project and run the
   contents of [`supabase/schema.sql`](supabase/schema.sql). This creates all
   tables, RLS policies, the `create_order`/`cancel_order`/`update_order_status`/
   `best_selling_flavors` RPC functions, and the public `menu-images` storage bucket.
3. **Set env vars**: copy `.env.local.example` to `.env.local` and fill in your
   project's URL and anon key (Project Settings → API in the Supabase dashboard).
4. **Install deps and run**:
   ```bash
   npm install
   npm run dev
   ```
5. **Make yourself an admin**: sign up through the running app with your own
   account, then in the Supabase SQL editor run:
   ```sql
   update public.profiles set role = 'admin'
     where id = (select id from auth.users where email = 'you@example.com');
   ```
   There's no public "become admin" flow by design — admin accounts are provisioned
   manually.
6. **Add menu items** at `/admin/menu` — each item needs a `flavor`, which drives
   both the customer-facing filter and the best-seller analytics.

## How it works

- **Ordering**: cart lives in `localStorage` (`src/lib/cart-context.tsx`). Checkout
  calls the `create_order` Postgres function, which re-derives prices from the
  current menu server-side — the client never gets to dictate what an order costs.
- **Roles**: a `role` column on `profiles` (`customer` | `admin`), checked via the
  `is_admin()` SQL function and enforced both in Supabase RLS and in
  `src/proxy.ts` (Next's request-time gate for `/admin/*` and other authed routes).
- **Ratings**: a customer can only rate a menu item if RLS finds a `completed`
  order of theirs containing that item — see the `ratings_insert_if_purchased`
  policy in `supabase/schema.sql`.
- **"Best-selling flavor"**: the `best_selling_flavors` SQL function aggregates
  `order_items` by flavor for completed orders, filterable by a day range. This is
  a plain analytics rollup, not a trained ML model — see `/admin` for the chart.

## Drink sizes (requires a patch)

The storefront sells three sizes. `menu_items.price` is the **medium** price;
small and large are derived from it by the deltas in
[`src/lib/sizes.ts`](src/lib/sizes.ts), so the admin UI still manages one price
per item.

`create_order` re-derives every line price server-side, so the server needs
those same deltas. **Run [`supabase/patches/001_size_pricing.sql`](supabase/patches/001_size_pricing.sql)
in the Supabase SQL editor.** It adds a nullable `order_items.size` column and
replaces `create_order` with a size-aware version; it is additive and safe to
re-run.

Until it is run, the cart quotes a size-adjusted price while the order records
the medium price — the customer would see one number and be charged another. If
you would rather not patch the database, set every `priceDelta` in
`src/lib/sizes.ts` to `0`; size then becomes a preparation preference at a flat
price and the two stay in agreement.

Both files carry a "keep in sync" comment pointing at the other. If you change a
delta, change it in both places.

## Design system

The storefront (home, product page, header, footer, cart, checkout) is built on
CSS custom properties defined at the top of
[`src/app/globals.css`](src/app/globals.css), exposed to Tailwind v4 through
`@theme inline`.

- **Tokens are named by role, not shade** — `ink`, `ink-soft`, `muted`, `line`,
  `line-strong`, `raised`, `surface`, `card`, plus `inverse-*` for dark panels.
  Components use `text-muted` / `border-line`, never `text-stone-500`.
- **The palette is monochrome by design.** `--hi-accent` currently points at ink;
  pointing it at a brand colour is a one-line change that repaints every CTA.
  Re-check `--hi-accent-fg` contrast against the new accent when you do.
- **Contrast is verified, not assumed.** The ratio in each comment is computed.
  Body text meets WCAG 2.1 AA (4.5:1) on every surface it sits on, and
  `line-strong` meets 3:1 for UI boundaries. `--hi-line` is decorative only —
  never use it as an input's only visible edge.
- **Dark mode is not enabled** but the token layer is ready for it. See the note
  at the bottom of `globals.css` for what still has to move onto tokens first.

## Current scope (v1)

Pickup only, cash on pickup (no payment gateway). Delivery and online payment
(e.g. GCash/PayMongo) are natural next additions once the ordering flow is
validated in the shop.

# Project Understanding — Hiatus

> Generated from a structured five-phase scan of the repository (config, entry points,
> architecture, data models, environment/CI) plus a cross-check of every API path the
> frontend calls against the routes the backend actually mounts.

---

## 1. Executive Summary

**Hiatus** is an order-ahead coffee-shop system for a single cafe counter. Customers
browse a menu, build a cart, customise drink sizes, check out and track their order
through a `pending → preparing → ready → completed` lifecycle. Staff work a live,
auto-refreshing queue, take payment at a POS (cash / e-wallet, with change, discounts,
refunds and voids), toggle items sold-out, and clock in and out against a cash drawer.
Admins get a dashboard, reports with CSV export, menu CRUD with photo upload, team
roster management and shop settings. Its value proposition is stated bluntly in
`PRODUCT.md`: *counter-first* — a barista must be able to work a rush without losing
track of an order or mis-taking payment.

The system is **two separately-running processes**. This repository is the Next.js 16
(App Router, React 19, TypeScript) frontend, which owns rendering, authentication
*gatekeeping*, session cookies, cache revalidation and browser push sending. A sibling
Express + Mongoose API in `../server` owns persistence, JWT issuance, pricing
re-derivation, the payment ledger and analytics aggregation. The two talk over HTTP:
the frontend proxies `/api/*` and `/uploads/*` to `http://localhost:4000` via
`next.config.ts` rewrites, and server actions call the API directly through
`src/lib/api-client.ts`.

Two things define the current state of the codebase. First, the **design system is the
most finished artifact** — 863 lines of hand-computed, WCAG-audited CSS custom
properties in `globals.css`, a hand-rolled component library, no third-party UI kit,
and documentation that treats contrast ratios as facts rather than estimates. Second,
there is a **visible seam where the product outgrew the backend**: a large set of
features (team management, settings, shifts, profile editing, notification feed,
receipts) is fully built in the UI and wired through server actions, but the Express
route modules those actions call do not exist. The API's `index.js` mounts them through
a `try/catch` that silently swallows `MODULE_NOT_FOUND`, so those calls fail soft —
pages fall back to defaults or empty states rather than crashing. `README.md` and
`PRODUCT.md` describe intended behaviour (timezone-aware reporting, cumulative
`is_active` revocation) that the running code does not yet deliver.

---

## 2. Tech Stack & Tools

**Frontend (this repo, `HIATUS/`)**

- **Next.js 16.3.1** — App Router, React Server Components, Server Actions, Route
  Handlers, `next/font/google`, `next/image`, `next/cache` revalidation
- **React 19.2.8** + **React Compiler** (`reactCompiler: true`, `babel-plugin-react-compiler`)
  — automatic memoisation, so the code avoids hand-tuned `useMemo`
- **TypeScript 5** — `strict: true`, `noEmit`, path alias `@/* → ./src/*`, `npx tsc --noEmit` passes clean
- **Tailwind CSS v4** via `@tailwindcss/postcss` — design tokens declared as CSS custom
  properties and exposed through `@theme inline` (no `tailwind.config.js`)
- **jose** — JWT verification in the request-time proxy (`src/proxy.ts`)
- **web-push** — VAPID-signed Web Push sending, server-side only (inside server actions)
- **zod** — declared as a dependency (schema validation; not yet a load-bearing part of the request path)
- **recharts** — admin analytics charts (resolved to hex via `lib/use-token-colors.ts`,
  because SVG `fill` attributes can't hold `var()`)
- **react-hot-toast** — toasts, themed from the same `--hi-*` tokens
- **ESLint 9** flat config + `eslint-config-next`
- Fonts: **Anton** (display), **Oswald**, **JetBrains Mono** (UI chrome), **Geist Sans** (body)

**Backend (`../server`, outside this git repo)**

- **Express 4** (CommonJS, `node --watch` in dev), **Mongoose 8** / **MongoDB**
- **jsonwebtoken** + **bcryptjs** — auth (`JWT_SECRET`, 7-day tokens)
- **multer** — image/video uploads to `server/uploads`, served statically at `/uploads`
- **nodemailer** — password-reset email over SMTP (Gmail app password)
- **cors**, **dotenv**

**Tooling / process**

- No test runner, no test files, no `.github/` workflows, no Docker, no deployment config
- `docs/*.md` serve as the *backend contract spec* (push notifications, password reset)
- `drafts/` holds static HTML design prototypes; `.playwright-mcp/` holds browser
  screenshots and console logs; `.claude/`, `.impeccable/` are git-ignored agent tooling
- `AGENTS.md` carries an auto-regenerated `nextjs-agent-rules` block warning that this
  Next.js version differs from training data — `node_modules/next/dist/docs/` is present
  and is the source of truth (note: `src/proxy.ts`, not `middleware.ts`, is the current
  request-gate convention)

---

## 3. Architecture Overview

### Pattern

**Two-tier client/server with a thin BFF layer.** Not MVC, not Clean Architecture — the
shape is:

```
Browser
  │  (localStorage cart, client contexts, polling router.refresh())
  ▼
Next.js App Router
  ├── src/proxy.ts           request-time auth gate (Next 16 "proxy" = old middleware)
  ├── Server Components      pages fetch directly from the API, render HTML
  ├── Server Actions         mutations, cookie handling, revalidatePath()
  ├── src/app/api/*          2 thin Route Handlers (signout, notification feed proxy)
  └── lib/push-server.ts     web-push sending, run inside after()
  │
  │  apiFetch() → NEXT_PUBLIC_API_URL  (or /api/* rewritten to :4000)
  ▼
Express API (../server)
  ├── middleware/auth.js     JWT verify → req.user; requireStaff / requireAdmin
  ├── routes/*               5 mounted routers + 4 *attempted* optional routers
  └── models/*               10 Mongoose schemas
  ▼
MongoDB
```

### The three-layer access-control model

Authority is **cumulative** (`admin ⊃ staff ⊃ customer`) and enforced in three places,
documented in `README.md` and `src/lib/roles.ts`:

1. **`src/proxy.ts`** — request-time gate. Reads the `token` cookie, `jwtVerify`s it,
   derives the role, and redirects (`/login?next=…`, `/admin`, `/staff`, `/?denied=…`).
   Also injects `x-pathname` into request headers, which `layout.tsx` reads to decide
   whether to render the site chrome, footer and customer tab bar.
2. **Each area's `layout.tsx`** — a Server Component `redirect()` (e.g.
   `src/app/staff/layout.tsx` re-checks and also loads the shift + today summary for
   the frame).
3. **Express middleware** — `auth`, `requireStaff`, `requireAdmin` at the API boundary.

Rule enforced by convention: nothing compares `role === "staff"` directly — counter work
asks `isStaff()` (true for staff *and* admin), the books ask `isAdmin()`, and
`isStaffOnly()` exists solely so the nav can hide customer links from a counter-only
account.

### Server Actions as the mutation layer

`src/app/actions/*.ts` (`account`, `admin`, `auth`, `menu`, `orders`, `profile`, `push`,
`settings`, `staff` — ~750 lines total) is where all writes happen. Each action:
reads the JWT from the cookie via `getServerToken()`, calls the Express API with
`apiJson`/`apiFetch`, calls `revalidatePath()` on every affected view, and returns a
typed `{ error, success }` state for `useActionState` forms. Errors are caught and
returned as copy written for people — network failures are rewritten in
`api-client.ts` rather than leaking `fetch failed`.

---

## 4. Key Directories

### This repo

| Path | What it holds |
| --- | --- |
| `src/proxy.ts` | The request-time auth/role gate. Next 16 file convention (formerly `middleware.ts`). |
| `src/app/` | App Router tree. `page.tsx` / `layout.tsx` / `loading.tsx` per route, colocated client components. |
| `src/app/actions/` | All Server Actions — the mutation layer for every feature. |
| `src/app/api/` | Two Route Handlers: `auth/signout` (clears the cookie) and `notifications` (proxies the feed with `no-store`). |
| `src/app/{admin,staff}/` | The two workspaces. Each has its own `layout.tsx` shell that opts out of the site navbar/footer. |
| `src/components/ui/` | The hand-rolled component library: `button`, `field`, `page-header`, `filter-tabs`, `stat-card`, `empty-state`, `badge`, `checker`, `product-image`, `modal`, `skeleton`, `spinner`, `data-error`, `hairline`, `quantity-stepper`, `size-selector`, `doodles`. |
| `src/components/` | Shared domain components: `navbar`, `mobile-nav`, `customer-tab-bar`, `auto-refresh`, `order-progress`, `order-status-badge`, `notification-bell`, `push-toggle`, `theme-provider`, plus `welcome/` and `home/` clusters. |
| `src/lib/` | Domain logic and edge adapters: `roles.ts` (authority), `auth.ts` (`getCurrentUser`, React `cache`-memoised per request), `api-client.ts`, `server-token.ts`, `cart-context.tsx`, `customer-data.ts` (shared server loaders), `order-meta.ts` (every user-facing word for an order fact), `settings.ts` (+ `isOpenNow`), `push-server.ts`, `order-alerts.ts`, `ratings.ts`, `csv.ts` (RFC 4180 + formula-injection guard), `format.ts`, `sizes.ts`, `hours.ts`. |
| `src/types/database.ts` | The frontend's hand-written domain model — the contract the UI is written against. |
| `src/app/globals.css` | 863 lines: the entire design-token system, dark-mode ramp, type roles, contrast rationale. |
| `src/content/shop.ts`, `src/assets/`, `resource/` | Editorial copy and brand imagery. |
| `docs/` | Two backend contract specs (`push-notifications-backend.md`, `password-reset-backend.md`), a design spec, two demo PDFs. |
| `drafts/` | Static HTML/CSS design prototypes (guest intro, staff queue lanes, welcome, login) — reference material, not shipped. |

### Backend (`../server`)

| Path | What it holds |
| --- | --- |
| `src/index.js` | Boot: CORS, JSON body, content-type guard, static `/uploads`, health check, mounts 5 routers, *attempts* 4 more via `require()` in a `try/catch`. |
| `src/middleware/auth.js` | `auth` (Bearer JWT → `req.user`), `requireStaff`, `requireAdmin`. |
| `src/models/` | `User`, `MenuItem`, `Order` (+embedded `orderItem`), `Payment`, `Rating`, `Favorite`, `OrderPreset`, `NotificationPrefs`, `PushSubscription`. |
| `src/routes/` | `auth.js` (191), `orders.js` (246), `menu.js` (82), `account.js` (109), `analytics.js` (117). |
| `src/utils/mailer.js` | SMTP password-reset email; logs a dev link when unconfigured. |

---

## 5. Data Flow & State

### Read path (DB → UI)

```
MongoDB document ({_id, ...})
  → Express route (JSON, often unpopulated references)
  → Server Component page (src/app/**/page.tsx)
      apiJson<T>("/path", { token })      ← token from the httpOnly cookie
      .catch(() => fallback)              ← "down" and "empty" get different messages
  → normalisation at the edge             ← idOf(), `o._id ?? o.id` folding
  → React Server Component renders HTML
  → user sees it
```

`src/lib/customer-data.ts` is the shared read layer for the signed-in home and menu
page; most other pages call `apiJson` directly. Mongo sends `_id`, so every loader
folds `_id → id` at the boundary and nothing downstream knows about it.

### Write path (UI → DB)

```
Client component (useActionState / onClick)
  → Server Action  (src/app/actions/*.ts)
      getServerToken()  → httpOnly `token` cookie
      apiJson("/path", { method, token, body })
  → Express route  (auth middleware → handler → Mongoose)
  → revalidatePath("/staff"); revalidatePath("/admin/orders"); …
  → Next re-renders the affected Server Components
  → (server actions that change order status also schedule
     after(() => sendOrderPush(...)) so push never blocks the response)
```

### State ownership — five distinct stores

| State | Where | Notes |
| --- | --- | --- |
| **Session** | httpOnly `token` cookie, set by the `signIn` action, deleted by `signOut` | Signed by Express, verified independently by `proxy.ts` with the same `JWT_SECRET`. `next` redirect targets are validated against `//` and `/\` open-redirects. |
| **Cart** | `localStorage["hiatus-cart"]` via `CartContext` | Lines keyed `menuItemId__size`. Hydrated in an effect (with an `hydrated` flag to avoid SSR mismatch) and migrated from a pre-size legacy shape. **Prices are display-only** — checkout sends *choices*, never prices. |
| **Server state** | Next Router cache + `revalidatePath()` | No React Query / SWR. Freshness comes from explicit revalidation plus `AutoRefresh` polling (`router.refresh()` every 15s on the queue, 20s on POS, paused while the tab is hidden, immediate refresh on becoming visible). |
| **UI state** | Local `useState` + **URL search params** | Filter tabs are links (`/staff?tab=ready`, `/admin/reports?range=30d`) — every filter state is a shareable URL, not component state. |
| **Theme** | `localStorage["hiatus-theme"]` + blocking inline `<head>` script | Sets `data-theme` before first paint to avoid the dark-mode white flash; falls back to OS preference. |

### Pricing and money invariants

- **Pricing is server-derived, always.** `POST /api/orders` re-reads every menu item and
  recomputes `unit_price = price + size_pricing[size]`, `subtotal`, `subtotal_amount`,
  `total_amount`. The client's cart price is never trusted.
- **Money is an append-only ledger.** `payments` rows have a positive `amount`; the sign
  lives in `kind` (`payment | refund | void`). A refund is a new row, never a mutation.
  `orders.payment_status` / `paid_at` are cached rollups of that ledger.
- `completed` is blocked server-side until `payment_status === "paid"`.

### Push notification flow

```
Staff presses "Mark ready"
  → advanceOrderStatus()            [action]
      getPushTargets(orderId)       ← read BEFORE the change (needs the *old* status)
      PUT /orders/:id/status
      after(() => sendOrderPush(...))  ← fire-and-forget
          shouldAlert(old, new, prefs) ← same rule as on-site alerts
          webpush.sendNotification(...) to each subscription (TTL 1h)
          404/410 → POST /push-subscriptions/prune
```

Gated by `NEXT_PUBLIC_PUSH_ENABLED` and VAPID keys in `.env.local`; when off, every
step degrades to a no-op rather than failing the status change.

---

## 6. Core Features

### Customer surface

| Feature | Code |
| --- | --- |
| Guest welcome (hero, menu peek, shop tour, hours) vs. signed-in home (live order, usual orders, categories, popular) — one URL, two audiences | `src/app/page.tsx`, `components/welcome/*`, `components/home/*` |
| Menu browse with category/flavour/search filters, rating badges | `src/app/menu/page.tsx`, `components/menu-filters.tsx`, `components/menu-item-card.tsx` |
| Item detail: sizes, description, reviews, add-to-cart, favourite | `src/app/menu/[id]/`, `components/star-rating.tsx` |
| Cart (localStorage, per-size lines), save as preset | `src/app/cart/`, `lib/cart-context.tsx` |
| Checkout — choices only, server re-prices; payment method + order type from settings | `src/app/checkout/checkout-form.tsx`, `actions/orders.ts → placeOrder()` |
| Order history + detail with progress, wait estimate, cancel, verified rating (with image/video attachment) | `src/app/orders/`, `actions/orders.ts` |
| Favourites & saved presets | `src/app/favorites/`, `actions/account.ts` |
| Profile, notification preferences, push opt-in | `src/app/profile/`, `actions/profile.ts`, `actions/push.ts` |
| Auth: signup, login, signout, forgot/reset password (rate-limited, single-use, SHA-256-hashed, 1h TTL) | `src/app/{login,signup,forgot-password,reset-password}/`, `actions/auth.ts`, `server/src/routes/auth.js` |
| On-site order alerts + Web Push | `components/order-alerts.tsx`, `lib/order-alerts.ts`, `lib/push-server.ts`, `public/sw.js` |

### Staff surface

| Feature | Code |
| --- | --- |
| **Order queue** — summary strip (open / avg wait / late / to collect / today), stage tabs, unified board sorted `ready → pending → preparing`, oldest-first, priority-weighted | `src/app/staff/page.tsx`, `queue-board.tsx`, `order-ticket.tsx` |
| One-tap advance (`Start making` → `Mark ready` → `Hand over`), with a dropdown for corrections | `lib/order-meta.ts` (`NEXT_STATUS`, `ADVANCE_LABELS`), `actions/staff.ts` |
| Prioritise, flag special request, assign table, notify-ready re-send | `actions/staff.ts` |
| **POS** — tabs for unpaid / settled / reversed; take payment, refund, void, manual discount, change calculation | `src/app/staff/pos/`, `payment-panel.tsx`, `actions/staff.ts` |
| Receipt view + print | `src/app/staff/pos/receipt/[id]/` |
| Mark sold out / back in stock | `src/app/staff/menu/`, `actions/staff.ts → setItemAvailability()` |
| Shift clock-in/out, drawer report | `src/app/staff/shift/`, `actions/staff.ts` |
| 15s/20s auto-refresh | `src/components/auto-refresh.tsx` |

### Admin surface

| Feature | Code |
| --- | --- |
| Dashboard — today's summary, 7-day sales sparkline (hand-rolled SVG), trending drinks, recent orders | `src/app/admin/page.tsx` |
| All orders with status control | `src/app/admin/orders/` |
| Menu CRUD with photo upload (multer → `/uploads`) | `src/app/admin/menu/`, `actions/menu.ts`, `server/src/routes/menu.js` |
| Reports — 7d / 30d / 12m ranges, revenue chart, items table, best-selling flavours, CSV export | `src/app/admin/reports/`, `lib/csv.ts` |
| Team roster: create account, grant/revoke role, activate/deactivate, edit credentials | `src/app/admin/team/`, `actions/admin.ts` |
| Settings: ordering, payment methods, business hours (with `isOpenNow`, timezone-aware), shop info, notification templates | `src/app/admin/settings/`, `actions/settings.ts`, `lib/settings.ts` |

### Backend domain endpoints that exist

```
GET    /api/health
POST   /api/auth/{signup,login,signout,forgot-password,reset-password}   GET /api/auth/me
GET|POST /api/menu            GET|PUT|DELETE /api/menu/:id    POST /api/menu/upload
GET    /api/menu/ratings/all
POST   /api/orders            GET /api/orders                 GET /api/orders/:id
POST   /api/orders/:id/{cancel,discount,table,priority,payment,rating}
PUT    /api/orders/:id/status GET /api/orders/:id/{ratings,push-targets}
POST   /api/orders/push-subscriptions/prune
GET|POST|DELETE /api/account/{favorites,favorites/:id,presets,presets/:id,
                              notifications,push-subscriptions,ratings}
GET    /api/analytics/{today,best-sellers,sales,popular-items}
```

---

## 7. Potential Bottlenecks / Technical Debt

Ranked roughly by severity. Items 1–3 are correctness/security, 4–7 are architecture,
8+ are hygiene.

### 1. `is_active` revocation does not actually work

`README.md` states a deactivated account "must lose access immediately, not at its next
login." It does not:

- `src/proxy.ts` line 43 hard-codes `const isActive = true;` — so the `isActive` check
  inside `isStaff()` / `isAdmin()` is dead code on every request.
- The JWT issued by `issueToken()` (`server/src/routes/auth.js`) carries `id, email,
  role, full_name` but **no `is_active`**, and `GET /api/auth/me` returns
  `req.user.is_active !== false` — which is `undefined !== false` → always `true`.
- Express middleware (`requireStaff` / `requireAdmin`) checks role only.

Net effect: deactivating a user in `/admin/team` does nothing until their 7-day token
expires. `setAccountActive()` in `actions/admin.ts` succeeds and the UI reports success.

### 2. A large feature set is UI-complete but has no backend

`server/src/index.js` mounts `profile`, `admin`, `staff`, `settings` inside a
`try/catch` that swallows `MODULE_NOT_FOUND` — those five route files **do not exist**.
Confirmed by grep: the only mentions of `shift|clock|team|settings|profile` in the
server are the names in that array. Frontend calls that therefore 404 (and are caught,
falling back to defaults/empty states):

| Frontend call | Used by |
| --- | --- |
| `GET/POST/PUT /admin/team…` (create, grant, active, role, credentials) | Team roster — the entire admin team feature |
| `GET /staff/shift`, `/staff/shifts`, `/staff/shifts/history`, `POST /staff/clock-in`, `/staff/clock-out` | Shift frame in `staff/layout.tsx`, whole shift page, team "on shift" indicator |
| `PUT /staff/menu/:id/availability` | Staff sold-out toggle |
| `GET /settings`, `PUT /settings/:key` | Every settings form, business hours, checkout payment methods, prep-time estimate |
| `PUT /profile` | Profile edit form |
| `GET /account/notification-feed` | Notification bell, `/notifications` page, `/api/notifications` proxy |
| `GET /orders/:id/payments` | Receipt page |
| `POST /orders/:id/notify-ready`, `/orders/:id/special-request` | Queue actions |

The `Shift` type in `src/types/database.ts` has **no corresponding Mongoose model**.

### 3. Contract mismatches between frontend and backend

- **Prune path**: frontend (`push-server.ts` line 96) and `docs/push-notifications-backend.md`
  both POST `/push-subscriptions/prune`; the server mounts it under
  `/api/orders/push-subscriptions/prune`. Dead subscriptions accumulate.
- **Priority payload**: `prioritizeOrder()` sends `{ prioritized: boolean }`;
  `POST /api/orders/:id/priority` reads `{ priority }` (a number) and writes it directly —
  so the star toggle stores `undefined`/`NaN` rather than a rank. `setOrderPriority()`
  (the other action on the same endpoint) sends the correct shape.
- **No `populate("user_id")` on `GET /api/orders`**, but `admin/page.tsx`,
  `staff/page.tsx` and `staff/pos/page.tsx` all cast `order.user_id` to
  `{ full_name, phone }`. It's an `ObjectId` string at runtime, so customer names
  silently fall back to the order code.

### 4. Documentation describes a different (Supabase-era) system

`src/types/database.ts` documents `shift_report()`, `list_team()`, `my_favorites()`
and "what RLS cannot reach"; `README.md` claims reporting functions take a `tz`
(default `Asia/Manila`) and truncate after converting. The Express implementation does
neither:

- `GET /api/analytics/sales` groups with `$dateToString` — **UTC**, no timezone
  parameter. `GET /api/analytics/today` uses `start.setHours(0,0,0,0)` — **server local
  time**. Both shift every "peak hour" and daily revenue bucket relative to Manila.
- Reports offer a `12m / month` grain (`admin/reports/page.tsx`), but the backend only
  ever returns `%Y-%m-%d` day buckets — the chart labels say "month" while the data is
  daily.
- No RLS, no SQL functions, no `payment` gateway, no email/SMS delivery (last two are
  acknowledged in README's "Current scope").

### 5. The backend is not version-controlled

`../server` is **outside this git repository** (`git ls-files ../server` → *outside
repository*), has no `.git` of its own, and has no lockfile discipline beyond
`package-lock.json`. The API that holds all the data and all the authorisation is the
one piece with no history, no review and no CI. This is the single biggest
reproducibility risk in the project.

### 6. Query patterns that won't scale

- `POST /api/orders` does `MenuItem.findById()` **inside a `for` loop** — one query per
  line item, no transaction. A 10-line cart is 10 sequential round trips.
- `GET /api/menu/ratings/all` is **unauthenticated, unbounded, and fully populated** —
  every rating in the database, joined to `User`, on every menu page load.
- `GET /api/analytics/today` loads **all of today's orders into memory** just to sum
  `total_amount`, and fires 4 separate `countDocuments` calls that could be one
  aggregation.
- `GET /api/orders` returns every order ever placed for staff/admin (no pagination,
  no date filter); the dashboard then `slice(0, 8)` client-side.
- `favorite` and `rating` unique indexes exist; `Order`, `MenuItem` and `Payment` have
  **no indexes** on `status`, `payment_status`, `user_id` or `created_at` — the exact
  fields every analytics and queue query filters and sorts on.

### 7. Auth hardening gaps

- Login is not rate-limited (only `forgot-password` is, via an in-memory `Map` that
  resets on restart and won't work across processes).
- `GET /api/menu/:id`, `GET /api/menu` and `GET /api/menu/ratings/all` are public by
  design; but `GET /api/orders` returns `{}` for any authenticated staff token with no
  `is_active` check (see item 1).
- `POST /api/menu` / `PUT /api/menu/:id` pass `req.body` **straight into
  `findByIdAndUpdate`** — no field allow-list, so a caller can write arbitrary keys
  (including `_id` attempts or `__proto__`-style keys) into a menu document.
- `uploadDirectory` filename uses `Math.round(Math.random() * 1e9)` (menu) vs
  `crypto.randomBytes` (reviews) — inconsistent; the review path is the correct one.
- CORS is a single origin from `CLIENT_URL`; no rate limiting, no helmet, no request
  size guard beyond `express.json()` defaults.

### 8. Testing, CI and lint

- **Zero tests.** No test runner configured, no `*.test.*` / `*.spec.*` files, no
  `coverage` config, no `.github/workflows`.
- **`npx tsc --noEmit` passes clean** (good — the strict config is real).
- **`npx eslint` fails: 8 errors, 3 warnings.** All 8 errors are
  `react-hooks/set-state-in-effect` (`theme-provider` ×2, `order-alerts` ×2,
  `payment-panel`, `profile-form`, `cart/save-preset`, `mobile-nav`). The 3 warnings are
  unused vars in `admin/page.tsx`, `staff/pos/page.tsx` and
  `drafts/welcome/home2/ui.js` — note `drafts/` (static prototypes) is **not** in
  `eslint.config.mjs`'s ignore list, only `.claude`, `.impeccable`, `.playwright-mcp`
  are, so prototype files are linted with the app's TS rules.
- No Prettier/editorconfig, so formatting consistency is enforced by review only.

### 9. Smaller smells worth noting

- `AuthState` / `SettingsState` / `ActionResult` types are redeclared per action file
  with overlapping shapes — no shared `action-result.ts`.
- `staff.ts` contains **two functions on the same endpoint**
  (`prioritizeOrder` and `setOrderPriority`) with different payloads — one should go.
- `getCurrentUser()` swallows *all* errors as `null`, so an API outage looks identical
  to "logged out" and bounces the user to `/login`.
- `admin/settings/page.tsx` renders a "Roles and access" section whose `<dd>` is empty —
  `ROLE_DESCRIPTIONS` exists in `lib/roles.ts` but is never used.
- `revalidatePath()` is called broadly (`revalidateOrderViews` touches 6 paths on every
  action) — correct but eager; each mutation re-renders surfaces it didn't touch.
- `next.config.ts` allows `images.remotePatterns` for **any host over http and https**,
  and the API writes user uploads to a directory served statically with no content-type
  sniffing guard.
- `mailer.js` contains a mojibake byte (`�?"`) in the reset-email body — the same
  encoding artifact appears in `auth.ts` comments. Cosmetic, but it means some strings
  were written through a broken codepage.

---

## Quick reference: how to run it

```bash
# 1. API (must be running first; lives outside this repo)
cd ../server && cp .env.example .env   # MONGO_URI, JWT_SECRET, PORT=4000, CLIENT_URL, SMTP_*
npm install && npm run dev

# 2. Frontend
cp .env.local.example .env.local       # JWT_SECRET must EQUAL server/.env's
npm install && npm run dev

# 3. Promote yourself
#    In MongoDB: db.users.updateOne({email:"you@x"}, {$set:{role:"admin"}})
```

`npm run build` / `npm start` for production; the app **refuses to start** in
production without `JWT_SECRET` (both processes independently), because the dev
fallback secret is public in `proxy.ts`.

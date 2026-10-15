# Staff Queue Redesign — Plan

> Scope: `/staff` (the order queue) and the `/staff` workspace chrome.
> Status: **proposal — awaiting approval before Phase 4 (code).**

---

## 1. The brief, and what it actually asks for

> "efficient, easy to navigate, and look underwhelming for the staff even if the orders are already stacking up"

That last clause is the real design problem, and it is a good one. It is a request for a
screen with a **flat emotional response to load**. Today the screen does the opposite:
it gets *louder* as the shop gets busier. Twelve new orders do not render as twelve
calm rows — they render as twelve orange slabs, twelve orange "New" chips, a permanent
orange incoming bar and a pulsing orange dot. A rush reads as a fire alarm, which is
precisely the condition under which a barista least needs one.

So the governing rule for this redesign:

> **The page's visual weight must not scale with queue depth.**
> Three orders and thirty orders must look like the same page. Busier means more rows,
> not more colour, more chrome, or bigger elements.

Everything below follows from that rule.

### What "efficient" means here

Not fewer clicks in the abstract — fewer *decisions per glance*. A barista holding a hot
drink with one hand free should be able to answer, in this order and in under a second:
what do I make, how long has it waited, what do I press. Three questions, three zones,
one scan line.

### What "easy to navigate" means here

The four sections (Queue / POS / Sold out / Shift) are already the right four. The
navigation problem is that the workspace chrome is inconsistent at small widths and the
queue's own stage filter is a third hand-rolled chip implementation. Fix both by reusing
what already exists.

---

## 2. Audit — what makes the current queue cluttered

Read against `src/app/staff/page.tsx`, `queue-board.tsx` (433 LOC), `order-ticket.tsx`
(245 LOC), `hand-over-panel.tsx`, `layout.tsx`.

| # | Problem | Where |
|---|---|---|
| 1 | **Seven columns.** Order · Items · Type · Status · Wait · Payment · Actions. Type hides at `<xl`, so six at desktop. | `queue-board.tsx:132` |
| 2 | **Status is redundant.** The stage column says "Making" while the button beside it says "Mark ready" — two ways to state one fact. The action button's *label already encodes the status*. | `queue-board.tsx:132` + `256-275` |
| 3 | **Colour scales with load.** `Start` is `bg-accent` (orange). A rush is a wall of orange. | `queue-board.tsx:258` |
| 4 | **56px controls on every row.** `min-h-14` button + a 56×56 ⋯ square. At 15 rows that is 15 slabs plus 15 grey boxes — the chrome outweighs the content. | `queue-board.tsx:255, 432` |
| 5 | **Up to seven pills per row.** Type chip + payment chip + stage label + up to four flag chips (New, Priority, Late, Over). | `queue-board.tsx:223-251` |
| 6 | **The incoming slot is permanent.** A 56px orange-bordered bar that reads "No new orders" when idle — attention spent on the absence of news. | `queue-board.tsx:97-121` |
| 7 | **Action width is unstable.** `Start` → `Mark ready` → `Take ₱340 · hand over`. The right edge is ragged, so there is no scan line. | `queue-board.tsx:256-275` |
| 8 | **Summary strip shouts.** `display text-2xl` Anton figures — the loudest type on the page is the count of how busy you are. | `staff/page.tsx:137` |
| 9 | **Two layouts, two arrangements.** Table `≥900px`, cards `<900px`, written twice and drifting apart. | `queue-board.tsx:128-175` |
| 10 | **No loading state.** No `loading.tsx` anywhere under `/staff` (admin has two). A live queue renders nothing, then everything. | — |
| 11 | **`order-ticket.tsx` is 245 lines of dead code.** `OrderTicket` is never imported; only its `QueueOrder` type is used. | grep |
| 12 | **Stage filter is a third chip skin** rather than the shipped `ui/filter-tabs.tsx`. | `staff/page.tsx:98-113` |
| 13 | **Shift chip hidden below `md`** — invisible on the tablet `PRODUCT.md` says this runs on. | `staff/layout.tsx:51-65` |
| 14 | **`/staff/shift` 404s** (known backend gap) → chip permanently reads "Not clocked in". | `staff/layout.tsx:32` |
| 15 | **Sticky header hardcodes `top-16`** against a bar that is ~56px. Fragile coupling. | `queue-board.tsx:136` |

Note on #14: we are on mock data for this work, so the chip will read real values from
the mock. When the backend lands, the same binding point works unchanged.

---

## 3. Design principles for the redesign

These are the rules I will hold each decision against. They extend the five principles
already in `PRODUCT.md` rather than replacing them.

### P1 — Flat emotional response

Nothing on this page gets louder because the queue got longer. Colour is spent on
*one thing at a time per row*, and the escalation ladder is a change in weight, not an
addition of hue.

### P2 — One question per zone

The row answers three questions in three zones: **what to make** (items), **how long**
(clock), **what to do next** (action). Anything that answers none of the three moves
into the ⋯ menu.

### P3 — The button is the status

If the row shows a button labelled `Mark ready`, the order is being made. A separate
status column repeating that is noise. Status text is retained for screen readers via
`aria-label`, never as a visible column.

### P4 — Fixed rhythm, fixed height

Rows are a fixed `min-h`. Loading skeletons are the same height. Empty state is the same
height as one row's slot. Nothing on this page reflows when data changes, because a
reflow under a finger is a mis-tap.

### P5 — Reuse before invent

`FilterTabs`, `Modal`, `EmptyState`, `DataError`, `Badge`, `Hairline`, `Spinner`,
`ControlSkeleton` all already exist and are tokenized. Any new component has to justify
itself against one of these first.

---

## 4. The redesign

### 4.1 Row anatomy — 7 columns become 4 zones

```
BEFORE                                       AFTER
───────────────────────────────────────     ─────────────────────────────────────────────
│ Order │ Items │ Type │ Status │ Wait │    │  ORDER                          WAIT │ [Start] │
│       │       │      │        │ Pay  │    │  #3F2A9C  Jai R. · Dine in · T3  12m  │         │
│       │       │      │        │      │    │  2× Iced Latte (L)                     │         │
│       │       │      │        │      │    │  1× Ube Cheesecake                     │         │
                                          └──────────────────────────────────────────────────┘
   6–7 columns, up to 7 pills,            4 zones, 0 pills by default, 1 button
   56px controls, ragged right edge       fixed height, aligned right edge
```

| Zone | Contents | Type role | Replaces |
|---|---|---|---|
| **Order** | `#3F2A9C` · name · `Dine in · T3` · optional note | `display text-base` for the code, `text-sm` for items, `text-xs text-muted` for metadata | Order column + Type column + Status column |
| **Items** | one line per item, `2× Iced Latte (L)` | `text-sm font-semibold` — the dominant element | Items column |
| **Clock** | wait minutes, right-aligned, tabular | `numeric text-sm`, colour escalates by weight | Wait column + Status chips |
| **Action** | one button, fixed `w-36` | `Button size="sm"` | 56px button + ⋯ in-column |

**What disappears and why:**

- **Type column** → inline metadata. `Dine in · T3` is not a fact that needs a pill; it
  sits beside the name where the dead `OrderTicket` already put it (`order-ticket.tsx:245`).
- **Status column** → P3. The button label carries it.
- **Payment chip** → reduced to a single word in the Clock zone, and only when it is
  `unpaid`. "Paid" is the default expectation and is not worth a pill on every row.
- **Flag chips (New / Priority / Late / Over)** → collapse to **at most one** marker,
  described in §4.3.

### 4.2 The calm-under-load mechanism

Three concrete moves that together deliver the brief.

**(a) Colour ceiling: one accent mark per row, never a fill.**

The `bg-accent` button fill is gone. The only accent on a pending row is the existing
4px inset left edge (`freshEdge`), which is already in the codebase
(`queue-board.tsx:339`) and is far quieter than a filled slab. So twelve new orders
render as twelve identical cream rows with a thin orange tick — the same page as twelve
old orders, not a wall of orange.

The action button uses `variant="outline"` for `Start` and `Mark ready`, and
`variant="primary"` only for `Hand over`. One espresso button per row is the maximum
emphasis the row is allowed.

**(b) Escalation is a gradient in weight, not a new hue.**

| Condition | Clock rendering | Row left-rule |
|---|---|---|
| under prep time | `text-muted` | 1px `--hi-line` |
| ≥ prep time | `text-ink-soft`, `font-medium` | 1px `--hi-line-strong` |
| ≥ 1.5× prep time | `text-warning`, plus the word `Over` | 2px `--hi-line-strong` |

No red. `--hi-danger` is reserved for the void/refund confirmations in the ⋯ menu, where
it belongs. A queue with five late orders shows five slightly firmer rows, not five red
alarms. Colour is still not the sole carrier — the word `Over` and the thickened rule are
both non-colour cues (WCAG 1.4.1).

**(c) Density is fixed, not proportional.**

Row height is `min-h-[4.25rem]` (68px) and never grows. Item lines beyond the third
collapse into `+2 more`, expandable via the ⋯ menu's "Show full order". A ten-item order
occupies the same vertical space as a one-item order, so one complicated ticket cannot
push the rest of the queue off-screen.

### 4.3 The incoming slot — earned, not permanent

Today the slot is always rendered and always 56px. Redesign:

- **Idle:** the slot does not render at all. The queue starts at the top.
- **Has incoming:** a single quiet row — `text-xs text-muted`, no fill, no border —
  reading `2 new · #3F2A9C · #A10B77` with a small `Show` button in `variant="ghost"`.

The pulse dot goes. A moving element in peripheral vision is exactly the wrong signal
for a barista who is deliberately not looking at the screen. The `aria-live="polite"`
announcer stays and is unchanged — it is the accessible path and it is already right.

This keeps the `[content-jumping]` guarantee from the current implementation: orders
still wait outside the table until "Show" is pressed. We are removing the *visual cost*
of that guarantee, not the guarantee.

### 4.4 The summary strip — quiet numbers

Currently `display text-2xl` (Anton, up to 26px) — the loudest type on the page is the
busyness count. Change to:

```
OPEN 8    WAIT 6m    LATE 2    TO COLLECT ₱1,240    TODAY 47
```

- `numeric text-lg` for values, `eyebrow text-muted` for labels.
- Loses `display` entirely. Anton is for headlines; a dashboard figure that jitters per
  digit is why `StatCard` already uses `numeric` (`stat-card.tsx:52`).
- `LATE` stays muted unless it is non-zero, at which point it moves to `text-ink`. Not
  to warning/danger — see P1.

### 4.5 Stage filter — reuse `FilterTabs`

The hand-rolled chips at `staff/page.tsx:98-113` are replaced by the shipped
`FilterTabs` (`ui/filter-tabs.tsx`), which already provides 44px control height,
tokenized active state, `aria-current="page"`, horizontal scroll and a `count` slot
rendered in the display face.

The current implementation is links with `aria-pressed`, which is semantically wrong —
`aria-pressed` is for toggle buttons, not navigation. `FilterTabs`' `aria-current` is the
correct pattern and the URLs stay identical (`/staff?tab=ready`).

### 4.6 Workspace chrome

- **`staff/layout.tsx`:** shift chip is `hidden … md:inline-flex` → make it visible at
  all widths, collapsing to the status dot plus `₱0` under `sm`. It answers "am I clocked
  in", which matters on a phone too.
- **`StaffNav`:** unchanged structure (Queue / POS / Sold out / Shift is correct), but
  the active state switches from `bg-ink text-surface` to match `AdminNav`'s `bg-accent`
  so the two workspaces agree.
- **Sticky offset:** replace the hardcoded `top-16` with a CSS variable
  `--staff-bar-h` published by the layout, so the table header cannot drift out of sync.

### 4.7 Loading, empty and error

| State | Component | Behaviour |
|---|---|---|
| **Loading** | new `src/app/staff/loading.tsx` | 6 skeleton rows at exactly `min-h-[4.25rem]`, plus a `ControlSkeleton` for the action column. `role="status"` line reads "Loading the queue". P4 means zero shift when data lands. |
| **Empty (no open orders)** | `EmptyState` | Existing copy: "Nothing in the queue / Every order has been handed over." Plus an `action` link to POS, since that is the next thing a barista does. |
| **Empty (filter yields nothing)** | `EmptyState` | "Nothing here / No orders are at this stage right now." |
| **Error** | `DataError` | Already correct — `showRetry` present. Unchanged. |

### 4.8 The ⋯ menu — one shared component

The queue currently has `RowMenu`/`MenuItem`/`MenuLink` (`queue-board.tsx:407-463`) and
the team page has two more hand-rolled dropdowns. Extract one:

**`ui/row-menu.tsx`** — `RowMenu` (labelled trigger, Esc + outside-click close,
`aria-haspopup="menu"`, `role="menu"`), `RowMenuItem` (with `danger` variant),
`RowMenuLink`. Tokenized: `bg-card`, `ring-line-strong`, `rounded-2xl`, `--hi-shadow-md`
— no hardcoded `shadow-[0_12px_30px_rgb(...)]`.

Moves into the menu: Prioritize · Flag request · Notify customer · Show full order ·
Print receipt · Mark sold out… · Refund… · Void…

### 4.9 Hand-over panel

Kept. It is the best thing on the current screen — one gesture takes payment and hands
over, and it correctly keeps the "pay before hand over" rule in the API rather than the
UI. Presentation changes only:

- The 68px cash quick-tender buttons drop to `min-h-control` (44px) to match the system.
- Everything else stands.

---

## 5. Mock data

**Pivot, flagged for your approval:** the brief is now the order queue, so the mock
dataset is **orders**, not staff members. "Orders stacking up" is what needs mocking.
The people-roster mock from the original spec no longer applies to this surface.

`src/lib/mock-staff-data.ts`, importing real types from `@/types/database` so the mocks
cannot drift from the domain model:

```ts
export type MockQueueOrder = QueueOrder;          // reuse the real shape
export const MOCK_SUMMARY: TodaySummary;
export const MOCK_QUEUE: MockQueueOrder[];        // ~14 orders
export const MOCK_SHIFT: MockShift;               // one open shift
export const MOCK_HISTORY: MockShift[];           // 4 finished shifts
```

**Coverage — the 14 orders deliberately include:**

| Edge case | Why it matters |
|---|---|
| Long name — `Maria Christalla Concepcion-Santos` | Truncation in the Order zone |
| Walk-in — `profiles: null` | Falls back to "Walk-in" |
| 6-item order | Tests the `+N more` collapse |
| Pickup note — `"Oat milk, no ice — allergy"` | The warning row |
| `special_request_flag` | Flag without a note |
| `priority > 0` | Prioritized ordering |
| 3 min / 11 min / 26 min waits | All three escalation bands |
| `dine_in` with `table_label` + `takeout` | Both type renderings |
| `unpaid` at ₱420, `paid`, `refunded` | Payment states |
| Two orders 40s apart | The incoming-slot demo |
| `cancelled` | Filtered out of `ACTIVE_STATUSES`, proves the filter |
| Non-Mongo ids (`mock-0001`) | `orderCode` still yields a readable `#MOCK00`-style code |

**Togglable by a single flag** — `USE_MOCKS` in the same module — so swapping back to
the live API is a one-line change and the real code path is not deleted.

---

## 6. Component breakdown

### New

| Component | Lives at | Purpose |
|---|---|---|
| `QueueRow` | `src/app/staff/queue-row.tsx` | The redesigned row. One file, ~140 LOC, replaces the dual row/card branches. |
| `QueueSummary` | `src/app/staff/queue-summary.tsx` | The quiet figures strip. |
| `IncomingOrders` | `src/app/staff/incoming-orders.tsx` | Renders only when non-empty. |
| `ui/row-menu.tsx` | `src/components/ui/` | Shared ⋯ menu (§4.8). |
| `loading.tsx` | `src/app/staff/` | Skeleton (§4.7). |
| `mock-staff-data.ts` | `src/lib/` | Mock data (§5). |

### Refactored

| File | Change |
|---|---|
| `queue-board.tsx` | 433 → ~180 LOC. Composition only: incoming + list + hand-over panel. Deletes `QueueRow`, `Chip`, `Spinner`, `RowMenu`, `MenuItem`, `MenuLink`. |
| `staff/page.tsx` | Stage filter → `FilterTabs`; summary → `QueueSummary`; mock wiring. |
| `staff/layout.tsx` | Shift chip responsive fix; `--staff-bar-h`; `StaffNav` active state. |
| `hand-over-panel.tsx` | Button heights to `min-h-control`. |
| `order-ticket.tsx` | **Delete.** 245 LOC, dead. Its `QueueBoardOrder` type moves to `src/types/staff.ts`. |

### Untouched (deliberately)

`payment-panel.tsx` · `menu/page.tsx` · `shift/page.tsx` · all of `/admin/*` · every
server action in `actions/staff.ts` · every Express route.

**No server action changes.** This is presentation and data-source work only. Every
interaction still calls `advanceOrderStatus`, `prioritizeOrder`, `refundOrder`,
`voidOrder`, `takePayment`, `notifyCustomerReady`, `flagSpecialRequest` exactly as today.

---

## 7. Design system integration

Explicit tokens and components, so nothing is re-derived:

| Concern | Uses |
|---|---|
| Row ground / page ground | `bg-card` on `bg-surface` — no new surfaces |
| Row separators | `divide-line` (decorative, 1.20:1 — correct use) |
| Interactive row border on hover | `--hi-line-strong` (3.39:1, AA non-text) |
| Accent mark | `--hi-accent` as a 4px inset rule **only**. Never as text (`--hi-accent-ink`), never as a fill on a row. |
| Action buttons | `Button` `variant="outline"` / `variant="primary"`, `size="sm"` |
| Destructive | `Button variant="danger"` inside `Modal danger` — `--hi-danger` appears nowhere else on the page |
| Late band | `--hi-warning` text + `--hi-line-strong` rule thickening |
| Numerals | `.numeric` (`font-variant-numeric: tabular-nums`) everywhere a figure changes |
| Metadata | `.ui-caps text-2xs text-muted` |
| Code | `.display text-base` |
| Row height | `min-h-[4.25rem]` — fixed |
| Filter chips | `ui/filter-tabs.tsx` (`h-control` = 44px) |
| Menu | `ui/row-menu.tsx` on `--hi-shadow-md`, `ring-line-strong` |
| Loading | `.skeleton` via `ControlSkeleton`, matched height |
| Empty / error | `ui/empty-state.tsx`, `ui/data-error.tsx` |
| Motion | bare `transition-colors` (defaults are already `--hi-dur-fast`/`--hi-ease`) |
| Focus | global `:focus-visible` ring — no per-component work |
| Reduced motion | already handled globally in `globals.css` |

**No new tokens. No new colours. No new type roles.** If a decision below needs a colour
that does not exist, that is a signal the decision is wrong.

---

## 8. Accessibility commitments

- Single `aria-live="polite"` announcer for incoming orders (already correct — kept).
- Every action button has a label naming its order: `Start order #3F2A9C`.
- ⋯ menu: `aria-haspopup="menu"`, `aria-expanded`, `role="menu"`/`menuitem`, Esc +
  outside-click close, focus returns to trigger.
- `aria-busy` + inline `Spinner` on the pressed action, per `ui/button.tsx`'s contract.
- Late/Over carried by **text and rule weight**, never colour alone (1.4.1).
- All borders that convey affordance use `--hi-line-strong`, never `--hi-line` (1.4.11).
- Table headers stay `scope="col"`; the Clock column's wait is never the only cue — the
  row rule escalates too.
- Touch targets ≥ 44px via `--spacing-control` and the global coarse-pointer rule.
- No new `setState`-in-effect patterns — the 8 existing `react-hooks/set-state-in-effect`
  ESLint errors are not made worse.

---

## 9. Risks and open questions

1. **Killing the status column is the one opinionated call.** It is justified by P3 but
   a first-time reader loses the explicit "Making" word. *Proposed mitigation:* the ⋯
   menu carries a "Show order details" item that names the status in prose.
2. **`+N more` on long orders** hides information behind a tap. On a counter, a tap is
   cheap but attention is not. *Proposed mitigation:* collapse only past the third line,
   and never collapse pickup notes — those are the safety-relevant ones.
3. **`FilterTabs` count slot uses the display face**, which §4.4 argues against for
   figures. *Proposed resolution:* use it here anyway — it is one small numeral beside a
   label, not a standalone dashboard figure, and consistency with the admin reports page
   wins.
4. **Mock-only scope** means the shift chip and `/staff/shift` page read from mocks.
   Both bindings are isolated behind one function, so the live swap is trivial.
5. **`order-ticket.tsx` deletion** is safe (grep confirms `OrderTicket` is never
   imported) but it is a deletion. Flagging it explicitly rather than quietly losing it.

---

## 10. What I need from you

Approve, or redirect on any of:

- **A.** The pivot from people-roster mock data to **order** mock data (§5).
- **B.** Deleting `order-ticket.tsx` (§9.5).
- **C.** Killing the visible status column in favour of the button label (§9.1).
- **D.** Whether POS and Sold-out get the same treatment in a follow-up, or stay as-is
  for now. This plan touches `/staff` only.

On approval I will write the code in this order: mock data → `ui/row-menu.tsx` →
`QueueRow` → `QueueBoard` → `QueueSummary` → `page.tsx` → `layout.tsx` → `loading.tsx`
→ delete `order-ticket.tsx` → `npx tsc --noEmit` and `npx eslint`.

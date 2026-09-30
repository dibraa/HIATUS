# Product

<!-- impeccable:product-sch @ema 1 -->

## Platform

web

## Users

**Primary:** Cafe/bar staff working the counter. They manage incoming orders, take payment, toggle menu availability, and track their shift. They work in a fast-paced environment with one hand on a keyboard and eyes on a screen that may be across the counter.

**Secondary:** Customers who browse the menu, place orders, and track pickup. Admins who manage the menu, view reports, and oversee the team.

## Product Purpose

Hiatus is a cafe ordering and counter management system. It lets customers browse a menu and place orders, and gives staff a focused interface to advance those orders through the queue, take payment, and manage what's available. Success means a barista can work through a rush without losing track of an order or mis-taking payment.

## Positioning

The system is purpose-built for a single cafe counter — not a generic admin dashboard. The staff interface is stripped to the three things a barista needs: what to make, how long it's been waiting, and what to do next. Every design decision serves speed and clarity at the counter.

## Operating Context

Staff work in a noisy, fast-paced cafe environment. They may be standing away from the screen, glancing at it between tasks. The interface is used on a counter-mounted screen or tablet, often in bright daylight or dim evening light. Clear status, timing, and live visual updates matter because staff cannot stare at the screen continuously.

## Capabilities and Constraints

- Customer menu browsing with categories, sizes, and images
- Cart and checkout with payment method selection
- Order queue with status lifecycle: pending → preparing → ready → completed, with cancellation support
- POS with cash/card/ewallet payment, change calculation, discounts, refunds, voids
- Menu availability toggling (sold out / back in stock)
- Shift management with clock in/out and cash drawer reconciliation
- Admin dashboard with analytics, menu management, and team oversight
- Role-based access: customer, staff, admin
- JWT-based authentication with middleware proxy
- Auto-refreshing order queue (15s) and POS (20s)

## Brand Commitments

- Design system codenamed "Co-Fi editorial" — cream ground, pine-green panel, espresso CTA
- Three type roles: display (Anton, condensed caps), ui (JetBrains Mono, tracked caps), body (Geist Sans)
- Flat design with no drop shadows except for floating elements
- Warm, cream-based palette with burnt orange accent and pine green secondary
- Dark mode support with a dedicated readable dark token ramp

## Evidence on Hand

- Full codebase with customer, staff, and admin surfaces
- Design tokens fully documented in `src/app/globals.css`
- Server actions and Express/MongoDB backend
- No external UI component library — hand-rolled design system

## Product Principles

1. **Counter-first:** Every design decision serves the barista working a rush. If it slows them down, it doesn't ship.
2. **Honest loading:** No optimistic updates for critical actions. The interface reflects what the database says, not what the user hopes.
3. **Bare tickets, not cards:** Order tickets are list items with hairline separators. Content is dominant; chrome recedes.
4. **Accessibility as foundation:** Real checkboxes with `role="switch"`, `aria-live` regions, `sr-only` labels, focus-visible rings. Colour is never the sole carrier of meaning.
5. **Consistency over novelty:** Shared components and tokens across all surfaces. No one-off solutions.

## Accessibility & Inclusion

- WCAG AA contrast ratios enforced in design tokens
- Keyboard navigation with visible focus rings
- `aria-live` regions for dynamic content (queue counts, availability changes)
- `role="switch"` for toggle controls
- Reduced motion support via `prefers-reduced-motion`
- Touch target sizes ≥44px on coarse pointers

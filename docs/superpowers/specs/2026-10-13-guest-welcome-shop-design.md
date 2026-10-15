# Guest welcome page: "The shop" (direction G)

Date: 2026-10-13 · Status: implemented 2026-10-13 · Mockup: `drafts/welcome/7-the-shop.html`

## Goal

Replace the guest view of `/` with a page that showcases the cafe itself — the room,
its corners, its handwritten cups — instead of ten stacked sections that compete for
attention. The page is the first step of a wider UI cleanup that keeps the
Co-Fi editorial design system (tokens, three type roles, flat + rounded) unchanged.

**Success looks like:** a guest understands within one screen what Hiatus is, that it
is open, and where to go next (visit, or sign in to order); the page has three
sections, not ten; signed-in customers see no change.

## Scope

In scope:
- The **guest branch** of `src/app/page.tsx` (`isGuest === true`).
- New presentational components for the three sections.
- Cropped shop photos added to `src/assets/shop/`.
- One keyframe (stamp rotation) added to `globals.css`, with a reduced-motion guard.

Out of scope (later passes):
- The signed-in home (menu, filters, favorites) — untouched.
- Navbar, footer, auth pages, staff and admin surfaces.
- Making tour content editable in admin Settings (YAGNI until asked for).
- Tweaks to G's copy and visuals — the user will direct those after it ships.

## Page structure (guest)

| # | Section | Content | Data source |
|---|---------|---------|-------------|
| 1 | **Arrive** (hero) | Open/closed status + location kicker; headline "A taste of home, of Bukidnon." (last line in `accent-ink`); one-line pitch; CTAs **Plan a visit** (→ `#visit`) and **Order ahead** (→ `/signup`); room photo in a matte card frame with "Hiatus Headquarters" caption and a pine rotating stamp ("Take that much needed break · Come in") | `isOpenNow(settings.businessHours)` |
| 2 | **Look around** (tour) | Espresso panel. Heading + one-line intro; three numbered spots (01 tin wall, 02 curio shelf, 03 counter) each with photo, mono-caps title, one-sentence caption; pull-quote "Salamat sa inyong pag-apit." with translation | Static constant `SHOP_TOUR` |
| 3 | **Come by** (visit) | Heading, line of copy, CTAs **Order ahead** (→ `/signup`) and **Sign in** (→ `/login`); Hours list; Find us (address, phone if set, Instagram, Facebook) | `settings.businessHours`, `settings.shopInfo`, static `SHOP_SOCIALS` |

Sections removed from the guest view: facts strip, guest teaser, featured panel,
loyalty band, promises, story, separate hours section, closing CTA. Their useful
content is absorbed: open status → hero kicker; hours → Come by; story → the tour.

Behaviour rules:
- **Closed state:** kicker reads "Closed · opens {time}" using the same `isOpenNow`
  result the current page uses; no other section changes.
- **Empty address:** the address line is omitted (not a placeholder). If address,
  phone and socials are all empty, the "Find us" column is omitted.
- **Hours:** rendered from `businessHours`, grouping consecutive days with identical
  hours (e.g. "Mon–Thu 7 AM – 8 PM"); closed days read "Closed".
- **Copy accuracy:** captions state only what the photos show. The user will supply
  any richer stories later.

## Components and files

```
src/app/page.tsx                      guest branch → <GuestWelcome settings=… open=… />
src/components/welcome/guest-welcome.tsx   composes the three sections (server component)
src/components/welcome/welcome-hero.tsx    section 1
src/components/welcome/shop-tour.tsx       section 2, renders SHOP_TOUR
src/components/welcome/visit-section.tsx   section 3
src/components/welcome/rotating-stamp.tsx  the SVG stamp (decorative, aria-hidden)
src/content/shop.ts                   SHOP_TOUR, SHOP_SOCIALS, SHOP_TAGLINE constants
src/lib/hours.ts                      groupBusinessHours() — pure, testable
src/assets/shop/{room,tin-wall,curio-shelf,counter}.jpg
src/app/globals.css                   @keyframes stamp-spin + reduced-motion rule
```

Each component takes plain props and fetches nothing; `page.tsx` keeps owning data
loading. `page.tsx` already fetches settings, so the guest path adds no requests — and
it should skip the favorites call for guests, as it already does.

Images use `next/image` static imports (automatic width/height, blur placeholder);
the hero photo is `priority` since it is the likely LCP element. Tour photos are
lazy. All photos carry descriptive `alt` text; the stamp is `aria-hidden`.

## Design-system rules applied

- Colours from existing tokens only: `surface`, `card`, `ink`, `ink-soft`, `muted`,
  `accent-ink`, `cta`/`cta-fg` (espresso panel), `inverse-bg` (stamp).
  The espresso panel needs two text tokens it doesn't have yet; add them to the
  `:root` block with their measured ratios, never as inline hex:
  `--hi-cta-muted: #cdbfa8` (9.19:1 on `--hi-cta`, captions/intro) and
  `--hi-cta-display: #e9b48c` (9.00:1, spot numbers only).
  Dark-mode values for both are derived the same way as the existing ramp.
- Type roles: Anton for headlines, JetBrains Mono caps for kicker/labels/numbers'
  captions, Geist for prose.
- Flat: no shadows; depth from the card matte frame and the stamp overlapping it.
- Vertical padding only on elements that also carry horizontal page gutters
  (the mockups hit this bug three times).

## Error handling

- Settings API down → `getSettings()` already falls back to defaults; page renders.
- Menu API down → irrelevant to guests now (the guest teaser that used it is gone).
- Missing photo is a build error (static import), not a runtime one.

## Verification

No test runner exists in the project; verification is:
1. `npm run lint` and `npm run build` pass.
2. `groupBusinessHours()` checked against the default hours and a closed-day case
   (small script or temporary assertion, not a new test framework).
3. Browser check, guest, at 1440×900 and 390×844: matches the mockup's structure,
   no horizontal overflow, CTA visible above the fold on desktop.
4. Browser check, signed in: home page identical to before.
5. Reduced-motion on → stamp does not rotate.

## Open questions for review

1. `src/components/hero-photo-picker.tsx` and edits in `page.tsx`/`globals.css` are
   currently **uncommitted** work from an earlier session. The new hero uses one fixed
   room photo, which likely makes the photo picker unused. Keep it, or remove it?
2. "Order ahead" for guests goes to `/signup`. Should it go to `/login` instead
   (returning customers)? The Come by section offers both.

## Decisions and deviations (recorded at implementation)

- **Open status is a sign on the photo**, not an eyebrow above the headline
  (pine when open, cream when closed). Closed reads "Closed · today 7 AM – 8 PM"
  or "Closed today", not "opens {time}": `isOpenNow` does not expose the current
  time, and today's hours are true both before opening and after closing.
- **Phones show the room photo first** (`order-first`); source order stays
  headline-first for screen readers.
- **"Order ahead" → `/signup`**; Come by also offers **Sign in** → `/login`.
- **Look around** (revised the same day, option A of `drafts/welcome/look-around.html`;
  D was tried and swapped back): an even row of three 4:3 photos on the
  `inverse-card` espresso panel — no spot numbers, no intro line, one-line
  captions, the Bisaya line as a quiet closing line. One token,
  `--hi-inverse-card-muted` (9.19:1 light / 10.24:1 dark), carries the captions;
  the panel keeps `ring-1 ring-line` so it has an edge in dark mode. The counter
  photo is a close-up of the handwriting, so it no longer repeats the menu card.
- **On the menu** (added after review): up to three available drinks, best-rated
  first, with "from ₱" (small-size) prices — guests now see prices — plus a pine
  "whole menu" tile; every card links to `/signup`. Hidden when no drink is
  available or the menu API fails.
- **Socials:** Instagram only. The Facebook page's URL is not printed on the
  shop's material, so it is omitted until known.
- **Guests share the home page's single parallel fetch** (menu, ratings,
  settings); `getCurrentUser()` makes no request without a token.
- **Footer** "About" links (guest-only) now point at `/#inside` and `/#visit`.
- **Hero photo picker** (`src/components/hero-photo-picker.tsx`): left in place,
  unused by the guest page; delete once confirmed unused elsewhere.

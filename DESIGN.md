---
name: Hiatus
description: A cafe counter in Malaybalay, on screen. Cream paper, pine signage, espresso ink.
colors:
  espresso-ink: "#14120f"
  roast-brown: "#3b352c"
  dusk-taupe: "#6b6152"
  cream-ground: "#efe9de"
  paper-white: "#fffdf8"
  oat-panel: "#e7dfcf"
  sand-line: "#ded3bf"
  bark-line: "#8a7c63"
  pine: "#3e6b53"
  pine-cream: "#f5ead8"
  pine-mist: "#d2e4d6"
  sage-display: "#9cc4a8"
  espresso-cup: "#241d18"
  espresso-cup-hover: "#3a2f26"
  burnt-orange: "#c87137"
  burnt-orange-ink: "#964a1c"
  burnt-orange-soft: "#f6e3d2"
  danger: "#a51f18"
  success: "#1f6b34"
  warning: "#8a4708"
typography:
  display:
    fontFamily: "Anton, Arial Narrow, Roboto Condensed, Impact, sans-serif"
    fontSize: "clamp(3rem, 1.733rem + 5.333vw, 6rem)"
    fontWeight: 400
    lineHeight: 0.88
    letterSpacing: "calc(-0.0397em + 1.11px)"
  headline:
    fontFamily: "Anton, Arial Narrow, Roboto Condensed, Impact, sans-serif"
    fontSize: "clamp(2.563rem, 1.692rem + 3.667vw, 4.625rem)"
    fontWeight: 400
    lineHeight: 0.92
    letterSpacing: "calc(-0.0397em + 1.11px)"
  title:
    fontFamily: "Anton, Arial Narrow, Roboto Condensed, Impact, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 0.92
  body:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, monospace"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.12em"
rounded:
  sm: "6px"
  md: "10px"
  lg: "16px"
  xl: "20px"
  2xl: "28px"
  3xl: "36px"
spacing:
  tight: "8px"
  snug: "12px"
  block: "24px"
  heading: "clamp(28px, 1.433rem + 1.333vw, 40px)"
  band: "clamp(56px, 2.233rem + 5.333vw, 104px)"
  section: "clamp(64px, 2.522rem + 6.222vw, 120px)"
  matte: "10px"
  control: "44px"
components:
  button-primary:
    backgroundColor: "{colors.espresso-cup}"
    textColor: "{colors.pine-cream}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0 20px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.espresso-cup-hover}"
  button-outline:
    backgroundColor: "{colors.paper-white}"
    textColor: "{colors.espresso-ink}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0 20px"
    height: "44px"
  button-outline-hover:
    backgroundColor: "{colors.espresso-cup}"
    textColor: "{colors.pine-cream}"
  button-secondary:
    backgroundColor: "{colors.pine}"
    textColor: "{colors.pine-cream}"
    rounded: "{rounded.md}"
    height: "44px"
  input-text:
    backgroundColor: "{colors.paper-white}"
    textColor: "{colors.espresso-ink}"
    rounded: "{rounded.md}"
    height: "44px"
  card:
    backgroundColor: "{colors.paper-white}"
    rounded: "{rounded.lg}"
    padding: "10px"
  panel-pine:
    backgroundColor: "{colors.pine}"
    textColor: "{colors.pine-cream}"
    rounded: "{rounded.2xl}"
  panel-espresso:
    backgroundColor: "{colors.espresso-cup}"
    textColor: "{colors.pine-cream}"
    rounded: "{rounded.2xl}"
---

# Design System: Hiatus

## Overview

**Creative North Star: "The Slow Counter"**

Hiatus looks like the counter it runs: cream paper on the wall, a pine sign by the door, espresso-dark ink on the cups. The system is warm, calm and local. Nothing on a screen competes for attention except the one thing the visitor needs next, whether that is the drink they came for, the order a barista has to make, or whether the shop is open. Calm here is a working property, not a mood board: staff glance at the screen from across a noisy counter, and a quiet screen is one they can read in a second.

The type does most of the talking. Tall condensed caps (Anton) carry headlines like a menu board; tracked mono caps (JetBrains Mono) carry every label, price and button the way a printed receipt would; a plain sans (Geist) carries anything meant to be read as a sentence. Surfaces are flat and tonal. Photographs always sit inside a cream matte, never touching a card's edge. Colour is rationed: pine for signage and panels, espresso for the one loudest action, burnt orange as a single highlight.

The customer pages breathe (fluid section gaps up to 120px); the staff counter is denser but follows the same tokens. Light and dark themes are both first-class, each with its own tuned ramp rather than an inversion.

**Key Characteristics:**
- Cream ground, pine panels, espresso actions, one burnt-orange accent
- Condensed display caps + tracked mono labels + plain sans body
- Flat, tonal surfaces; every photo matted in cream
- Soft, sturdy rounded rectangles (10px controls, 16px cards, 28px panels)
- Fluid spacing between sections, fixed spacing inside them
- Contrast ratios documented per token; WCAG AA by construction

## Colors

A warm, low-saturation paper palette with two committed brand colours (pine and espresso) and one rationed accent (burnt orange). Every value has a dark-theme twin tuned for readability, not mirrored.

### Primary
- **Pine** (pine): the brand's signage colour. The site footer, the "whole menu" tile, the open sign on the hero photo, the rotating stamp, the staff sidebar. Text on it is Pine Cream; secondary text on it is Pine Mist.
- **Espresso Cup** (espresso-cup): the loudest action on any screen (Order ahead, Add to cart, Checkout) and the dark "Look around" panel. Near-black, deliberately not orange.

### Secondary
- **Burnt Orange** (burnt-orange): fill only, never text (3.01:1 on cream). Selection highlight, active chips, the brand mark's side.
- **Burnt Orange Ink** (burnt-orange-ink): the text form of the accent. The last line of the hero headline, "See the full menu", the one orange word in the brand line.
- **Burnt Orange Soft** (burnt-orange-soft): the tint behind an active chip.

### Neutral
- **Espresso Ink** (espresso-ink): headings and primary text (15.71:1 on cream).
- **Roast Brown** (roast-brown): secondary text, pitches, descriptions (10.04:1).
- **Dusk Taupe** (dusk-taupe): captions, metadata, eyebrows (5.01:1).
- **Cream Ground** (cream-ground): the page.
- **Paper White** (paper-white): cards, mattes, inputs, the outline button at rest.
- **Oat Panel** (oat-panel): recessed panels, image placeholders, ghost-button hover.
- **Sand Line** (sand-line): decorative dividers ONLY (1.20:1). Never text, never an input's only edge.
- **Bark Line** (bark-line): interactive borders: inputs, outline buttons, toggles (3.39:1, AA non-text).
- **Pine Cream / Pine Mist / Sage Display**: the text ramp on pine. Sage Display (3.11:1) is for display-size text only.

### Named Rules
**The One Loud Button Rule.** Espresso fills the single most important action on a view. Burnt orange is a highlight, never a button fill, or it stops meaning anything.

**The Sand Line Rule.** Sand Line separates content; it never outlines a control. Anything a person types into or presses gets Bark Line or stronger.

**The Stay-Dark Panel Rule.** Panels that must read dark in both themes (the "Look around" panel) use the inverse-card tokens, not the CTA tokens, which flip to cream in dark mode.

## Typography

**Display Font:** Anton (with Arial Narrow, Roboto Condensed)
**Body Font:** Geist (with system-ui)
**Label/Mono Font:** JetBrains Mono (with ui-monospace)

**Character:** A menu board and its receipt. Anton is tall, condensed and always uppercase, set tight; JetBrains Mono is small, uppercase and widely tracked, so labels read as deliberate print rather than a terminal. Geist stays out of the way for anything read as prose.

### Hierarchy
- **Display** (Anton 400, 48 to 96px fluid, line-height 0.88): page headlines ("A taste of home, of Bukidnon.", "Good morning, ...").
- **Headline** (Anton 400, 41 to 74px fluid, 0.92): section headings ("On the menu", "Look around").
- **Title** (Anton 400, 18 to 44px, 0.92 to 0.98): card titles, drink names, the "whole menu" tile.
- **Body** (Geist 400, 16 to 18px, 1.6): pitches, descriptions, captions; measure capped around 34 to 62ch.
- **Label** (JetBrains Mono 500, 11 to 14px, 0.12em tracking, uppercase): buttons, nav, prices, status, eyebrows (0.2em tracking).

### Named Rules
**The Fluid Above, Fixed Below Rule.** Sizes from 2xl up interpolate between 380px and 1280px; reading sizes (2xs to xl) are fixed. Body text is never scaled with the viewport.

**The Caps Are Voices Rule.** Two uppercase voices, never mixed in one element: condensed Anton for things you read from a distance, tracked mono for things you act on.

## Layout

Content sits in a centred column (max 72rem / 1152px, 16px side padding). The guest welcome alternates a 5:7 split (headline left, photograph right) with full-width rows; on phones the photograph moves above the headline so the place comes before the words. Grids step through real states: two-up on phones and tablets, four-up from 1024px.

Spacing has four jobs. Section and band gaps are fluid (64 to 120px between sections, 56 to 104px inside a dark band); the heading gap barely moves (28 to 40px); the tight, snug and block steps (8, 12, 24px) are fixed, because the distance from a label to its value is typographic, not spatial.

**The Two Speeds Rule.** Space between sections breathes with the window; space inside a section does not.

## Elevation & Depth

Flat by default. Depth comes from tone (cream page, paper-white card, oat recess, pine or espresso panel) and from the matte, not from shadows. Shadows exist only for things that genuinely float.

### Shadow Vocabulary
- **Hairline** (`box-shadow: 0 1px 0 0 rgb(59 53 44 / 0.04)`): the faintest lift on a resting surface.
- **Floating** (`box-shadow: 0 2px 10px -6px rgb(59 53 44 / 0.16)`): popovers, menus, the toggle knob.
- **Overlay** (`box-shadow: 0 24px 50px -22px rgb(59 53 44 / 0.30)`): dialogs and sheets.

**The Flat Counter Rule.** If it does not float above the page, it does not cast a shadow.

## Shapes

Soft, sturdy rounded rectangles in three steps: 10px for controls, 16 to 20px for cards and images, 28px for panels and mattes. Buttons are rectangles, never pills; a pill reads as a different, chattier brand. Round shapes are reserved for things that are round in the room: the rotating stamp, status dots, the toggle track.

**The Matte Rule.** No photograph touches its card's edge. Images sit inside a 10px cream (paper-white) frame whose corner is rounder than the image's (28px frame around a 20px image).

## Components

Soft and sturdy: flat surfaces, firm edges, and one physical press.

### Buttons
- **Shape:** gently rounded rectangle (10px).
- **Primary:** espresso fill, cream mono-caps label, 44px tall (36px small, 48px large).
- **Outline:** paper-white with a bark border at rest; FILLS TO ESPRESSO on hover. The most recognisable interaction in the system.
- **Secondary / Inverse / Ghost / Danger:** pine fill; cream on pine panels; transparent with an oat hover; danger outline for destructive confirmations only.
- **States:** colour changes on hover; a single 1px press on active with a slight spring; disabled at 45% opacity; loading keeps the label and adds a spinner so the width never jumps.

### Cards / Containers
- **Corner Style:** 16px for cards, 28px for panels.
- **Background:** paper-white cards on cream; pine and espresso panels for signage and "stepping inside" moments.
- **Shadow Strategy:** none at rest (see Elevation).
- **Internal Padding:** 10px matte around imagery; 20 to 24px for text panels.

### Inputs / Fields
- **Style:** paper-white field, bark border (1px), 10px corner, 44px tall.
- **Focus:** border darkens to espresso ink plus the global 2px focus outline.
- **Disabled:** oat background, taupe text.

### Navigation
- **Customer:** logo left, mono-caps links, espresso "Sign up" button, theme toggle; collapses to a menu on phones.
- **Staff:** pine icon sidebar with the brand mark; active item inverts to cream with pine text.

### The Door Sign (signature)
A small pine plate on the hero photograph saying whether the shop is open, until when, and how to get there. Pine when open, paper-white when closed; the words carry the state, so colour is never the only signal.

### The Stamp (signature)
A pine disc lapping over the hero photo's corner, its mono-caps ring ("TAKE THAT MUCH NEEDED BREAK") turning slowly around an upright "Come in". Stops under reduced motion.

## Do's and Don'ts

### Do:
- **Do** use espresso for the one primary action per view, and pine for signage and panels.
- **Do** put every photograph in a cream matte (10px gutter, rounder frame than image).
- **Do** use Bark Line (#8a7c63) or stronger for the edge of anything a person types into or presses.
- **Do** keep controls 44px tall; on touch screens even small controls lift to 44px.
- **Do** set headings in uppercase Anton and labels in tracked uppercase JetBrains Mono.
- **Do** design light and dark together, using each theme's own ramp.

### Don't:
- **Don't** fill a button with burnt orange or set body text in it.
- **Don't** use Sand Line (#ded3bf) as an input's only border, or for text.
- **Don't** make buttons pill-shaped.
- **Don't** add shadows to resting cards or panels.
- **Don't** add background textures or grids to the page; the ground is plain cream.
- **Don't** scale body text with the viewport.

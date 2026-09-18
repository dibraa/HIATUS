/**
 * Hand-drawn marginalia and the hero's category glyphs.
 *
 * The comp fills its quiet corners with single-weight line drawings — cookies
 * beside the feature panel, a cupcake and a croissant flanking the loyalty
 * offer. They are drawn rather than photographed, at one stroke width, and
 * they never carry meaning: everything here is `aria-hidden`, and callers set
 * the colour with `.doodle` / `.doodle-inverse`.
 *
 * Stroke weight is set per drawing rather than globally: these render at wildly
 * different sizes (a 40px tile glyph, a 200px margin drawing), and a single
 * weight would come out hairline at one end and marker-thick at the other.
 */

import type { ReactNode } from "react";

type MarkProps = { className?: string };

function Svg({
  className = "",
  children,
  strokeWidth = 2,
}: MarkProps & { children: ReactNode; strokeWidth?: number }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

/** Two overlapping chocolate-chip cookies. Sits beside the feature panel. */
export function CookiesDoodle({ className }: MarkProps) {
  return (
    <Svg className={className}>
      <circle cx="38" cy="40" r="24" />
      <circle cx="64" cy="62" r="24" />
      <circle cx="31" cy="34" r="2.5" />
      <circle cx="44" cy="33" r="2" />
      <circle cx="35" cy="48" r="2" />
      <circle cx="46" cy="46" r="2.5" />
      <circle cx="58" cy="56" r="2.5" />
      <circle cx="70" cy="55" r="2" />
      <circle cx="62" cy="70" r="2" />
      <circle cx="73" cy="67" r="2.5" />
    </Svg>
  );
}

/** A cupcake in its pleated wrapper. Flanks the loyalty offer.
 *
 * The wrapper tapers (a case is narrower at its base than its rim) and the
 * pleats follow that taper rather than running straight down, which is the
 * difference between a drawn case and a labelled trapezoid. The frosting is
 * one continuous swirl of three turns, not a lumpy outline. */
export function CupcakeDoodle({ className }: MarkProps) {
  return (
    <Svg className={className}>
      {/* Case: rim at y=52, tapering in to a narrower base at y=86. */}
      <path d="M30 52h40l-6 31a5 5 0 0 1-5 4H41a5 5 0 0 1-5-4z" />
      {/* Pleats, splayed with the taper. */}
      <path d="M42 53l2 34M50 53v34M58 53l-2 34" />
      {/* The rim itself reads as a band. */}
      <path d="M33 60h34" />
      {/* Frosting: three swirl turns rising to a point. */}
      <path d="M30 52c-6-5-4-13 4-14-4-8 3-15 11-12 2-7 12-8 15-1 8-2 13 5 10 12 8 2 8 12 0 15" />
      <path d="M36 38c5 3 12 4 19 2M44 26c4 4 10 5 16 3" />
      {/* Cherry. */}
      <circle cx="53" cy="17" r="4" />
      <path d="M53 21c-1 2-2 3-4 4" />
    </Svg>
  );
}

/** A croissant, seen from above. Flanks the loyalty offer on the other side.
 *
 * Drawn as a BODY rather than a band. The previous version was a thin crescent
 * arc with three ticks across it, and a thin closed crescent at this size
 * reads as a smile or an umbrella no matter how the seams are drawn — there is
 * not enough enclosed area for the eye to call it food. So this is the fat,
 * rolled form: a baked body with the two horn tips tucked at its shoulders and
 * three rolled seams splaying from the centre. */
export function CroissantDoodle({ className }: MarkProps) {
  return (
    <Svg className={className}>
      <path d="M16 56c-1-7 3-12 9-11 3-9 12-14 25-14s22 5 25 14c6-1 10 4 9 11 0 10-8 18-18 21-10 3-22 3-32 0-10-3-18-11-18-21z" />
      <path d="M32 46c0 10 2 20 6 28M50 41v34M68 46c0 10-2 20-6 28" />
    </Svg>
  );
}

/** A coffee bean, for anywhere the other three would be too sweet. */
export function BeanDoodle({ className }: MarkProps) {
  return (
    <Svg className={className}>
      <ellipse cx="50" cy="50" rx="32" ry="23" transform="rotate(-28 50 50)" />
      <path d="M28 61c9-5 11-14 15-20 4-7 12-11 20-13" />
    </Svg>
  );
}

/* --------------------------------------------------------------------------
   Category glyphs — the four dark tiles laid over the hero photograph.

   Drawn on the same 100-unit grid and at the same stroke weight as the
   marginalia above, so a tile and a doodle look like the same hand.
   -------------------------------------------------------------------------- */

/** A cup on a saucer. */
export function CupGlyph({ className }: MarkProps) {
  return (
    <Svg className={className} strokeWidth={4}>
      <path d="M22 34h44v20a20 20 0 0 1-20 20h-4a20 20 0 0 1-20-20z" />
      <path d="M66 40h8a11 11 0 0 1 0 22h-8" />
      <path d="M16 84h60" />
    </Svg>
  );
}

/** Beans. */
export function BeansGlyph({ className }: MarkProps) {
  return (
    <Svg className={className} strokeWidth={4}>
      <ellipse cx="38" cy="38" rx="20" ry="14" transform="rotate(-35 38 38)" />
      <path d="M28 46c5-4 6-9 9-13" />
      <ellipse cx="62" cy="64" rx="20" ry="14" transform="rotate(-35 62 64)" />
      <path d="M52 72c5-4 6-9 9-13" />
    </Svg>
  );
}

/** A portafilter, seen from above. */
export function FilterGlyph({ className }: MarkProps) {
  return (
    <Svg className={className} strokeWidth={4}>
      <circle cx="42" cy="46" r="24" />
      <circle cx="42" cy="46" r="12" />
      <path d="M62 60l22 22" />
    </Svg>
  );
}

/** A stovetop moka pot. */
export function PotGlyph({ className }: MarkProps) {
  return (
    <Svg className={className} strokeWidth={4}>
      <path d="M30 50h34l-5 34H35z" />
      <path d="M34 50l4-24h20l3 12" />
      <path d="M64 34h10a8 8 0 0 1 0 16h-8" />
    </Svg>
  );
}

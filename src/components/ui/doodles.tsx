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

/** A cupcake in its pleated wrapper. Flanks the loyalty offer. */
export function CupcakeDoodle({ className }: MarkProps) {
  return (
    <Svg className={className}>
      <path d="M30 52h40l-5 29a7 7 0 0 1-7 6H42a7 7 0 0 1-7-6z" />
      <path d="M41 57l3 24M50 57v24M59 57l-3 24" />
      <path d="M31 52c-3-9 2-16 9-16 0-9 7-14 14-11 6-4 14 0 14 8 7 1 10 9 6 19z" />
      <circle cx="52" cy="17" r="4" />
      <path d="M52 21v4" />
    </Svg>
  );
}

/** A croissant. Flanks the loyalty offer on the other side. */
export function CroissantDoodle({ className }: MarkProps) {
  return (
    <Svg className={className}>
      {/* A crescent band: one wide arc out, a tighter one back, closed. The
          three short strokes across it are the rolled seams. */}
      <path d="M18 72A38 38 0 0 1 82 72A32 32 0 0 0 18 72Z" />
      <path d="M25 47L33 55M50 34L50 46M75 47L67 55" />
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

import { BRAND_MARK_PATH, BRAND_MARK_VIEWBOX } from "./brand-path";

/**
 * The wordmark, semi-3D.
 *
 * One traced path, drawn five times: four copies stepped down and to the
 * right in the accent colour make an extruded side, and the ink copy on top
 * is the face. Depth from STACKING, not from a shadow — the same rule the
 * rest of the system's surfaces follow — so it stays flat-looking in the
 * comp's sense while reading as a printed, slightly raised mark.
 *
 * Colours are tokens: ink and accent invert together in dark mode (cream face,
 * caramel side), so the mark never needs a second variant. On hover the face
 * lifts one step off its side on the spring curve, the system's "a tap was
 * answered" move. Decorative: every link that wraps it carries its own label.
 */
const DEPTH = 8; // viewBox units; ~1.6px at header size
const STEPS = 4;

export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox={BRAND_MARK_VIEWBOX}
      aria-hidden="true"
      focusable="false"
      className={`group w-auto overflow-visible ${className}`}
    >
      <defs>
        <path id="hiatus-mark" fillRule="evenodd" d={BRAND_MARK_PATH} />
      </defs>

      {/* The side: deepest step first so each shallower copy overlaps it. */}
      {Array.from({ length: STEPS }, (_, i) => {
        const offset = DEPTH - (i * DEPTH) / STEPS;
        return (
          <use
            key={offset}
            href="#hiatus-mark"
            transform={`translate(${offset} ${offset})`}
            className="fill-accent"
          />
        );
      })}

      {/* The face. Lifts up-left on hover of any `group` ancestor (the nav link). */}
      <use
        href="#hiatus-mark"
        className="fill-ink transition-transform duration-(--hi-dur-base) ease-hi-spring group-hover:-translate-x-0.5 group-hover:-translate-y-0.5"
      />
    </svg>
  );
}

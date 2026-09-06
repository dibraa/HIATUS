/**
 * A section rule.
 *
 * This used to paint the old palette's checkerboard, which the Co-Fi direction
 * has no place for — that comp separates sections with space, a surface change
 * or a full-bleed band, never with a decorative pattern. Rather than delete a
 * component eight pages import, it now draws what the direction does allow: a
 * hairline in the line colour of whatever surface it sits on.
 *
 * The two things that are easy to get wrong are still got right here:
 *
 *   1. `aria-hidden` and `role="presentation"`. A rule conveys nothing to a
 *      screen reader, and an unlabelled decorative div is noise in the
 *      accessibility tree.
 *   2. The right colour for the surface underneath — a line in the page's line
 *      colour disappears on the pine panel, so `tone` picks it.
 *
 * `size` is kept in the signature so existing call sites still typecheck; a
 * hairline has one weight, so it no longer changes what is drawn.
 */
export function CheckerBand({
  tone = "accent",
  className = "",
}: {
  /** The surface it sits on, which decides the line colour. */
  tone?: "accent" | "green" | "soft" | "inverse";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const toneClass = {
    accent: "bg-line",
    green: "bg-line",
    soft: "bg-line",
    inverse: "bg-inverse-line/50",
  }[tone];

  return (
    // The height is an inline style, not a class: several call sites still
    // pass their old `h-2` / `h-1.5` for the band this used to be, and which of
    // two competing height utilities wins is decided by stylesheet order, not
    // by the order they appear in the attribute. An inline style is the only
    // way to guarantee a hairline stays a hairline.
    <div
      aria-hidden="true"
      role="presentation"
      style={{ height: "1px" }}
      className={["w-full", toneClass, className].filter(Boolean).join(" ")}
    />
  );
}

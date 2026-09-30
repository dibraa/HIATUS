/**
 * A section rule — a 1px hairline that separates content.
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
 */
export function Hairline({
  tone = "accent",
  className = "",
}: {
  /** The surface it sits on, which decides the line colour. */
  tone?: "accent" | "green" | "soft" | "inverse";
  className?: string;
}) {
  const toneClass = {
    accent: "bg-line",
    green: "bg-line",
    soft: "bg-line",
    inverse: "bg-inverse-line/50",
  }[tone];

  return (
    <div
      aria-hidden="true"
      role="presentation"
      style={{ height: "1px" }}
      className={["w-full", toneClass, className].filter(Boolean).join(" ")}
    />
  );
}

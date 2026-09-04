/**
 * The brand's checkered rule.
 *
 * A decorative band used to close a section, edge a card, or separate the hero
 * from the menu — the PineBrew signature. The pattern itself is the `.checker`
 * utility in globals.css; this component exists so the two things that are
 * easy to get wrong are got right every time:
 *
 *   1. `aria-hidden` and `role="presentation"`. A checkerboard conveys nothing
 *      to a screen reader, and an unlabelled decorative div is noise in the
 *      accessibility tree.
 *   2. The right pattern colour for the surface underneath. Burnt orange on
 *      forest green is 2.59:1 — barely visible — so a band on an inverted
 *      panel has to switch to the panel's own line colour. `tone` picks it.
 *
 * Height is a Tailwind class rather than a prop with magic numbers, so a band
 * can sit on the same spacing scale as everything around it.
 */
export function CheckerBand({
  tone = "accent",
  size = "md",
  className = "h-2.5",
}: {
  /** The surface it sits on, which decides the pattern colour. */
  tone?: "accent" | "green" | "soft" | "inverse";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const toneClass = {
    accent: "",
    green: "checker-green",
    soft: "checker-soft",
    inverse: "checker-inverse",
  }[tone];

  const sizeClass = { sm: "checker-sm", md: "", lg: "checker-lg" }[size];

  return (
    <div
      aria-hidden="true"
      role="presentation"
      className={["checker w-full", toneClass, sizeClass, className]
        .filter(Boolean)
        .join(" ")}
    />
  );
}

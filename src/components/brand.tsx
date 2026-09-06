/**
 * The wordmark.
 *
 * A condensed-caps word with a thin ring overlapping its last letters — the
 * comp's identity mark, where the circle sits ON the word rather than beside
 * it. That overlap is the whole idea, so the ring is absolutely positioned and
 * the word carries right padding to make room for it, instead of the two being
 * laid out as siblings that would drift apart at different sizes.
 *
 * The ring is `border-current`, so the mark inherits whatever colour it is
 * dropped into — cream on the pine panel, ink on the header — and never needs
 * a second variant.
 */
export function Wordmark({
  size = "md",
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const { text, ring, pad } = {
    sm: { text: "text-base", ring: "h-6 w-6 -right-1", pad: "pr-4" },
    md: { text: "text-xl", ring: "h-8 w-8 -right-1.5", pad: "pr-5" },
    lg: { text: "text-3xl", ring: "h-11 w-11 -right-2", pad: "pr-7" },
  }[size];

  return (
    <span className={`relative inline-flex items-center ${className}`}>
      <span className={`display ${text} ${pad} tracking-[0.02em]`}>Hiatus</span>
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute top-1/2 -translate-y-1/2 rounded-full border border-current ${ring}`}
      />
    </span>
  );
}

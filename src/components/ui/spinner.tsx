/**
 * A single loading indicator for the whole system.
 *
 * Three sizes cover every case: `sm` for inline text buttons, `md` for
 * card-level loading, `lg` for full-page skeletons. The spinner is a
 * circle with a gap — the gap is what reads as "spinning" rather than
 * "a circle that happens to be partially coloured".
 *
 * `aria-hidden` on the visual, with the caller providing a `role="status"`
 * label — the spinner itself carries no information, the text does.
 */
export function Spinner({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = {
    sm: "h-3.5 w-3.5",
    md: "h-5 w-5",
    lg: "h-8 w-8",
  };

  return (
    <svg
      aria-hidden="true"
      className={`hi-spinner ${sizes[size]} ${className ?? ""}`}
      focusable="false"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeOpacity="0.16"
        strokeWidth="2.5"
      />
      <g className="hi-spinner__arc">
        <path
          d="M12 2a10 10 0 1 1-8.66 15"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}

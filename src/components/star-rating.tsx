"use client";

const SIZES = { sm: "h-3.5 w-3.5", md: "h-7 w-7" } as const;

function Star({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="currentColor" aria-hidden="true">
      <path d="M10 1.6l2.47 5.29 5.53.72-4.08 3.9 1.05 5.68L10 14.42 5.03 17.19l1.05-5.68L2 7.61l5.53-.72L10 1.6z" />
    </svg>
  );
}

/**
 * Star rating, in two distinct modes.
 *
 * - `readOnly`: a single image in the accessibility tree ("Rated 4.5 out of
 *   5 stars"). Five separate disabled buttons — the previous behaviour — put
 *   five meaningless, unusable controls in front of a screen-reader user.
 *   Supports fractional values so a 4.5 average is not rounded away.
 * - interactive: real radio inputs in a fieldset, giving arrow-key selection
 *   and correct "3 of 5" announcements without hand-rolled ARIA.
 */
export function StarRating({
  value,
  onChange,
  readOnly = false,
  size = "md",
  label = "Your rating",
  tone = "light",
}: {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: "sm" | "md";
  label?: string;
  /** Set to "dark" on inverted surfaces — ink-filled stars vanish on them. */
  tone?: "light" | "dark";
}) {
  const starClass = SIZES[size];
  const filledColor = tone === "dark" ? "text-inverse-fg" : "text-ink";
  const emptyColor = tone === "dark" ? "text-inverse-line" : "text-line";

  if (readOnly) {
    // Clamp then convert to a width percentage for the filled overlay.
    const clamped = Math.max(0, Math.min(5, value));
    const percent = (clamped / 5) * 100;

    return (
      <span
        role="img"
        aria-label={`Rated ${clamped.toFixed(1)} out of 5 stars`}
        className="relative inline-flex align-middle"
      >
        {/* Empty track */}
        <span aria-hidden="true" className={`flex gap-0.5 ${emptyColor}`}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} className={starClass} />
          ))}
        </span>

        {/* Filled overlay, clipped to the score. Inner row is a copy at full
            width so the clip cuts through a star rather than shrinking it. */}
        <span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 overflow-hidden"
          style={{ width: `${percent}%` }}
        >
          <span className={`flex w-max gap-0.5 ${filledColor}`}>
            {[0, 1, 2, 3, 4].map((i) => (
              <Star key={i} className={starClass} />
            ))}
          </span>
        </span>
      </span>
    );
  }

  return (
    <fieldset className="min-w-0">
      <legend className="sr-only">{label}</legend>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <label key={star} className="cursor-pointer">
            <input
              type="radio"
              name="star-rating"
              value={star}
              checked={value === star}
              onChange={() => onChange?.(star)}
              className="peer sr-only"
            />
            <Star
              className={`${starClass} transition-colors duration-150 ease-hi
                peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink
                ${star <= value ? filledColor : `${emptyColor} hover:text-line-strong`}`}
            />
            <span className="sr-only">{`${star} star${star > 1 ? "s" : ""}`}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/**
 * Stars plus the numeric score and review count — the form used on product
 * cards and the product page, where the count is the actual trust signal.
 */
export function RatingSummary({
  average,
  count,
  size = "sm",
  tone = "light",
}: {
  average: number | null;
  count: number;
  size?: "sm" | "md";
  tone?: "light" | "dark";
}) {
  const muted = tone === "dark" ? "text-inverse-muted" : "text-muted";

  // No ratings yet is worth saying plainly; an empty row of grey stars reads
  // as a bad score rather than as missing data.
  if (average === null || count === 0) {
    return <span className={`text-xs ${muted}`}>No ratings yet</span>;
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <StarRating value={average} readOnly size={size} tone={tone} />
      <span className={`text-xs font-medium ${tone === "dark" ? "text-inverse-fg" : "text-ink-soft"}`}>
        {average.toFixed(1)}
      </span>
      <span className={`text-xs ${muted}`}>
        ({count}
        <span className="sr-only"> {count === 1 ? "review" : "reviews"}</span>)
      </span>
    </span>
  );
}

"use client";

/**
 * Minus / value / plus stepper.
 *
 * The buttons carry the item name in their accessible label ("Decrease
 * quantity of Spanish Latte") because a cart page renders several of these and
 * a bare "Decrease quantity" is ambiguous out of context. The value is a live
 * region so the new count is announced after a press.
 */
export function QuantityStepper({
  value,
  onChange,
  itemLabel,
  min = 1,
  max = 99,
  tone = "light",
  size = "md",
}: {
  value: number;
  onChange: (next: number) => void;
  itemLabel: string;
  min?: number;
  max?: number;
  tone?: "light" | "dark";
  size?: "sm" | "md";
}) {
  const isDark = tone === "dark";
  const pad = size === "sm" ? "h-9 w-9" : "h-11 w-11";

  const shell = isDark
    ? "border-inverse-line text-inverse-fg"
    : "border-line-strong text-ink";
  const hover = isDark
    ? "hover:bg-inverse-fg/10 disabled:hover:bg-transparent"
    : "hover:bg-raised disabled:hover:bg-transparent";

  return (
    <div className={`inline-flex items-center rounded-md border ${shell}`}>
      <button
        type="button"
        className={`${pad} flex items-center justify-center rounded-full text-lg leading-none transition-colors disabled:opacity-40 ${hover}`}
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label={`Decrease quantity of ${itemLabel}`}
      >
        <span aria-hidden="true">&minus;</span>
      </button>

      <span
        className={`w-8 text-center text-sm font-medium numeric ${
          size === "sm" ? "w-7" : "w-8"
        }`}
        aria-live="polite"
        aria-atomic="true"
      >
        <span className="sr-only">{`Quantity of ${itemLabel}: `}</span>
        {value}
      </span>

      <button
        type="button"
        className={`${pad} flex items-center justify-center rounded-full text-lg leading-none transition-colors disabled:opacity-40 ${hover}`}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label={`Increase quantity of ${itemLabel}`}
      >
        <span aria-hidden="true">+</span>
      </button>
    </div>
  );
}

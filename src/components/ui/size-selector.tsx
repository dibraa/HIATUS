"use client";

import { SIZE_OPTIONS, type DrinkSize } from "@/lib/sizes";

/**
 * Size picker, built on real radio inputs inside a fieldset.
 *
 * Native radios give us arrow-key navigation, roving tab order and the right
 * announcement ("Medium, 16 ounces, radio button, 2 of 3") for free — all of
 * which would have to be hand-rolled with ARIA if these were <button>s.
 * The input stays in the DOM (sr-only) and the visible chip is its label.
 */
export function SizeSelector({
  value,
  onChange,
  /** Radios need a shared, page-unique name; pass the item id. */
  name,
  tone = "light",
  disabled = false,
}: {
  value: DrinkSize;
  onChange: (size: DrinkSize) => void;
  name: string;
  tone?: "light" | "dark";
  disabled?: boolean;
}) {
  const isDark = tone === "dark";

  return (
    <fieldset disabled={disabled} className="min-w-0">
      <legend
        className={`mb-2 eyebrow ${
          isDark ? "text-inverse-muted" : "text-muted"
        }`}
      >
        Size
      </legend>

      <div className="flex gap-2">
        {SIZE_OPTIONS.map((option) => {
          const selected = option.code === value;
          return (
            <label key={option.code} className="group flex-1 cursor-pointer">
              <input
                type="radio"
                name={`size-${name}`}
                value={option.code}
                checked={selected}
                onChange={() => onChange(option.code)}
                className="peer sr-only"
                // Named on the input itself, not the wrapping <label> — a label
                // names its control from its text content ("M", "16 oz"), and
                // aria-label on the label element is not reliably honoured.
                // Spelling the size out, plus the price impact, gives a far more
                // useful announcement than the visible letter alone.
                aria-label={`${option.label}, ${option.volume}${
                  option.priceDelta === 0
                    ? ""
                    : `, ${option.priceDelta > 0 ? "plus" : "minus"} ${Math.abs(
                        option.priceDelta
                      )} pesos`
                }`}
              />
              <span
                className={[
                  "flex h-full flex-col items-center justify-center rounded-md border px-2 py-2",
                  "text-center transition-colors",
                  // Focus lives on the sr-only input, so mirror it onto the chip
                  "peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2",
                  isDark
                    ? "peer-focus-visible:outline-inverse-fg"
                    : "peer-focus-visible:outline-ink",
                  isDark
                    ? selected
                      ? "border-inverse-fg bg-inverse-fg text-inverse-bg"
                      : "border-inverse-line text-inverse-fg group-hover:border-inverse-muted"
                    : selected
                      ? "border-ink bg-ink text-accent-fg"
                      : "border-line-strong text-ink-soft group-hover:border-ink group-hover:bg-raised",
                ].join(" ")}
              >
                <span className="text-sm font-semibold leading-none">{option.code}</span>
                <span
                  className={`mt-1 text-2xs leading-none ${
                    selected
                      ? isDark
                        ? "text-inverse-bg/70"
                        : "text-accent-fg/70"
                      : isDark
                        ? "text-inverse-muted"
                        : "text-muted"
                  }`}
                >
                  {option.volume}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

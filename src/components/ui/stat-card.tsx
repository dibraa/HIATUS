import type { ReactNode } from "react";

/**
 * A single figure with its label — the unit the dashboards are built from.
 *
 * The value is the largest thing in the card and the label sits ABOVE it in
 * the DOM, so a screen reader reads "Revenue today, ₱4,820" rather than
 * announcing a bare number and then explaining it. Visually the label is still
 * the small text on top, so the reading order and the visual order agree.
 *
 * `tabular-nums` on the value is what stops a row of stat cards jittering as
 * figures update — proportional digits change width per glyph.
 */
export function StatCard({
  label,
  value,
  hint,
  tone = "default",
  icon,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  /** `attention` is for a figure that means someone has to do something. */
  tone?: "default" | "attention" | "positive";
  icon?: ReactNode;
}) {
  const toneClasses = {
    default: "border-line bg-card",
    attention: "border-accent/40 bg-accent-soft",
    positive: "border-success/30 bg-success-soft-bg",
  }[tone];

  const valueTone = {
    default: "text-ink",
    attention: "text-ink",
    positive: "text-success-soft-fg",
  }[tone];

  return (
    <div className={`rounded-2xl border p-5 shadow-[0_8px_24px_-20px_rgba(81,48,36,0.55)] ${toneClasses}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-muted">
          {label}
        </p>
        {icon && (
          <span aria-hidden="true" className="shrink-0 text-muted">
            {icon}
          </span>
        )}
      </div>

      <p className={`mt-2 text-2xl font-semibold tabular-nums ${valueTone}`}>{value}</p>

      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

/** The responsive row these sit in. Kept here so every dashboard uses the
 *  same column counts and the pages do not each invent a grid. */
export function StatGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">{children}</div>
  );
}

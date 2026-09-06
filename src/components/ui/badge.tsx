import type { ReactNode } from "react";

/**
 * A small labelled pill for a fact about a row: a role, a tender, whether the
 * money arrived, whether a promo is live.
 *
 * The order-status badge stays its own component (`order-status-badge.tsx`)
 * because a lifecycle has an opinion about which state should shout — this one
 * is for facts that are merely different from each other, not ranked.
 *
 * Set in tracked mono caps, like every other label in the system, and cornered
 * as a soft rectangle rather than a pill so it sits in the same shape family
 * as the controls beside it.
 *
 * Colour is never the only cue. Every badge renders its label as text, so
 * removing all colour leaves the meaning intact (WCAG 1.4.1). The tints exist
 * to make a table scannable, not to carry the information.
 */
export type BadgeTone =
  | "neutral"
  | "accent"
  | "green"
  | "ink"
  | "success"
  | "warning"
  | "danger";

const TONES: Record<BadgeTone, string> = {
  neutral: "border-line-strong bg-card text-ink-soft",
  accent: "border-transparent bg-accent-soft text-accent-ink",
  green: "border-transparent bg-inverse-bg text-inverse-fg",
  /** The comp's dark chip — for a fact that should read as a stamp. */
  ink: "border-transparent bg-cta text-cta-fg",
  success: "border-transparent bg-success-soft-bg text-success-soft-fg",
  warning: "border-transparent bg-warning-soft-bg text-warning-soft-fg",
  danger: "border-transparent bg-danger-soft-bg text-danger-soft-fg",
};

export function Badge({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={`ui-caps inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1 text-2xs ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

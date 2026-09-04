import type { ReactNode } from "react";

/**
 * A small labelled pill for a fact about a row: a role, a tender, whether the
 * money arrived, whether a promo is live.
 *
 * The order-status badge stays its own component (`order-status-badge.tsx`)
 * because a lifecycle has an opinion about which state should shout — this one
 * is for facts that are merely different from each other, not ranked.
 *
 * Colour is never the only cue. Every badge renders its label as text, so
 * removing all colour leaves the meaning intact (WCAG 1.4.1). The tints exist
 * to make a table scannable, not to carry the information.
 */
export type BadgeTone =
  | "neutral"
  | "accent"
  | "green"
  | "success"
  | "warning"
  | "danger";

const TONES: Record<BadgeTone, string> = {
  neutral: "border-line-strong bg-card text-ink-soft",
  accent: "border-transparent bg-accent-soft text-accent-ink",
  green: "border-transparent bg-inverse-bg text-inverse-fg",
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
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

import type { OrderStatus } from "@/types/database";

/**
 * Order lifecycle badge.
 *
 * Three redundant cues carry the state, so none of them is load-bearing alone:
 * the written label, the fill weight (outlined → filled → emphasised), and a
 * dot. That ordering is deliberate — a customer scanning a list should be able
 * to spot "Ready for pickup" by weight alone, and still read it if their
 * display or their vision drops the hue (WCAG 1.4.1).
 */

const STYLES: Record<OrderStatus, string> = {
  /* Waiting on the shop — outlined, lowest weight. */
  pending: "border-line-strong bg-transparent text-ink-soft",
  /* Being made — neutral fill, more presence than pending. */
  preparing: "border-transparent bg-raised text-ink",
  /* The one the customer is waiting for — the only emphasised state. */
  ready: "border-transparent bg-success-soft-bg text-success-soft-fg",
  /* Done — recedes; it needs to be findable, not noticed. */
  completed: "border-line bg-transparent text-muted",
  cancelled: "border-transparent bg-danger-soft-bg text-danger-soft-fg",
};

const LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  preparing: "Preparing",
  ready: "Ready for pickup",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${STYLES[status]}`}
    >
      {/* currentColor ties the dot to the label, so the pair can never drift */}
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      {LABELS[status]}
    </span>
  );
}

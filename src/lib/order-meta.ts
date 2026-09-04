import type {
  OrderStatus,
  OrderType,
  PaymentMethod,
  PaymentStatus,
} from "@/types/database";

/**
 * The words the app uses for an order's facts.
 *
 * These live together because they are read together — a ticket shows a
 * status, a type, a tender and a payment state in one row — and because the
 * customer-facing wording is a brand decision, not an implementation detail.
 * The database stores `dine_in`; nobody should ever see that string.
 *
 * Customer copy stays conversational ("Waiting on the counter for you"),
 * matching the guardrail against technical jargon in customer-facing UI. The
 * staff copy is terser on purpose: a queue is scanned, not read.
 */

export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  dine_in: "Dine in",
  takeout: "Takeout",
};

export const ORDER_TYPE_HINTS: Record<OrderType, string> = {
  dine_in: "We will bring it to your table.",
  takeout: "Collect it from the counter.",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Cash",
  card: "Card",
  ewallet: "E-wallet",
};

export const PAYMENT_METHOD_HINTS: Record<PaymentMethod, string> = {
  cash: "Pay at the counter when you collect.",
  card: "Tap or insert at the counter.",
  ewallet: "GCash, Maya or a QR wallet at the counter.",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  unpaid: "Unpaid",
  paid: "Paid",
  refunded: "Refunded",
  voided: "Voided",
};

/** Order lifecycle, in the words a customer reads on their own order page. */
export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  preparing: "Preparing",
  ready: "Ready for pickup",
  completed: "Completed",
  cancelled: "Cancelled",
};

/** What the customer should do next. Sits under the badge so the status is
 *  never left to be interpreted. */
export const STATUS_NEXT_STEP: Record<OrderStatus, string> = {
  pending: "The shop has your order and will start it shortly.",
  preparing: "Being made now. We will let you know the moment it is ready.",
  ready: "Waiting on the counter for you.",
  completed: "Collected. Thanks for ordering.",
  cancelled: "This order was cancelled and will not be charged.",
};

/**
 * The status a ticket moves to when staff press the one obvious button.
 *
 * Modelled as a chain rather than a free choice because the queue's primary
 * action should be a single tap: a barista holding a hot drink should not be
 * picking from a dropdown. The dropdown still exists for corrections.
 *
 * `ready` deliberately does NOT advance to `completed` automatically —
 * completing means the customer took it, which only a person can know.
 */
export const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  pending: "preparing",
  preparing: "ready",
  ready: "completed",
};

/** The label on that one-tap button. */
export const ADVANCE_LABELS: Partial<Record<OrderStatus, string>> = {
  pending: "Start making",
  preparing: "Mark ready",
  ready: "Hand over",
};

/** Statuses the shop still owes a drink for. */
export const ACTIVE_STATUSES: OrderStatus[] = ["pending", "preparing", "ready"];

/**
 * Formats a wait as something a person says out loud.
 *
 * Rounds to the nearest 5 minutes above 10, because a queue estimate is not
 * precise and "about 15 minutes" is honest where "13 minutes" pretends to a
 * accuracy the number does not have.
 */
export function formatWait(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return "a few minutes";
  if (minutes < 2) return "about a minute";
  if (minutes <= 10) return `about ${Math.round(minutes)} minutes`;
  return `about ${Math.round(minutes / 5) * 5} minutes`;
}

/** "7 AM" — used on the peak-hours axis and in business-hours copy. */
export function formatHour(hour: number): string {
  const period = hour < 12 ? "AM" : "PM";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display} ${period}`;
}

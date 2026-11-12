import { formatPrice } from "./format";

/** Over this much above the total is almost always a slipped extra zero. */
export const MAX_OVERPAY = 10000;

/** Exact, then the next ₱100, ₱500 and ₱1000 strictly above the total. */
export function quickCash(total: number): number[] {
  const above = [100, 500, 1000].map((step) => Math.floor(total / step) * step + step);
  return [total, ...above.filter((amount, i) => above.indexOf(amount) === i)];
}

/** Why this cash can't be accepted for this total, or null when it can. */
export function cashError(cash: number, total: number): string | null {
  if (!Number.isFinite(cash) || cash <= 0) return "Type the cash received";
  if (cash < total) return `Short by ${formatPrice(total - cash)}`;
  if (cash > total + MAX_OVERPAY) return "That's over ₱10,000 more than the total. Check the amount";
  return null;
}

/**
 * The payment's saved reference line: the exact cash handed over and the change.
 * shortcut: stored as text in the API's existing `reference` field because the
 * backend has no cash columns; move to real fields if the API adds them.
 */
export function cashReference(cash: number, total: number): string {
  return `Cash ${formatPrice(cash)} · change ${formatPrice(cash - total)}`;
}

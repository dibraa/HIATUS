import type { NotificationPreferences, OrderStatus } from "@/types/database";

/** The two "what to tell you about" switches from the profile's notification form. */
export type AlertPreferences = Pick<NotificationPreferences, "order_updates" | "ready_alerts">;

/** What a customer who never opened the preferences screen gets: everything on. */
export const DEFAULT_ALERT_PREFERENCES: AlertPreferences = {
  order_updates: true,
  ready_alerts: true,
};

/**
 * Decides whether a status change is worth interrupting the customer for.
 *
 * One rule for every channel: the order page calls it for on-site alerts
 * (pop-up, chime, tab title) and push-server.ts calls it before sending a
 * browser push. `previous` is never equal to `next`.
 *
 * The page itself still updates either way — this only decides whether to
 * draw attention to the change.
 */
export function shouldAlert(
  previous: OrderStatus,
  next: OrderStatus,
  prefs: AlertPreferences
): boolean {
  // Every status maps to exactly what the profile's preference labels
  // promise, so an alert is never something the customer wasn't told about.
  void previous;
  switch (next) {
    // Always, whatever the switches say: a customer who isn't told walks
    // over for an order that isn't coming. The preferences screen says so.
    case "cancelled":
      return true;
    // "Ready for pickup — when your order is on the counter."
    case "ready":
      return prefs.ready_alerts;
    // "Order progress — when we accept your order and start making it."
    case "pending":
    case "preparing":
      return prefs.order_updates;
    // Collected: they're at the counter holding the drink.
    case "completed":
      return false;
  }
}

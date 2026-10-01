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
 * Called on the order page each time a refresh brings a different status
 * than the one already on screen. `previous` is never equal to `next`.
 *
 * Returning true shows the on-site alert (pop-up, chime and tab title).
 * The page itself still updates either way — this only decides whether to
 * draw attention to the change.
 */
export function shouldAlert(
  previous: OrderStatus,
  next: OrderStatus,
  prefs: AlertPreferences
): boolean {
  // TODO(you): decide which changes deserve an alert. See the notes in the chat.
  void previous;
  void next;
  void prefs;
  return false;
}

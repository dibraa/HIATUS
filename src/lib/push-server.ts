import webpush, { type PushSubscription } from "web-push";
import { apiJson } from "@/lib/api-client";
import { getSettings } from "@/lib/settings";
import { orderCode } from "@/lib/format";
import { STATUS_LABELS } from "@/lib/order-meta";
import { shouldAlert, type AlertPreferences } from "@/lib/order-alerts";
import { PUSH_ENABLED } from "@/lib/push-flag";
import type { OrderStatus } from "@/types/database";

/*
 * Server-side half of browser push. Only ever imported by server actions.
 *
 * Storage stays in the Express API (see docs/push-notifications-backend.md):
 * this module asks it who to notify, sends with web-push, and tells it which
 * subscriptions the push service reported as gone.
 */

/** What the Express API returns for GET /orders/:id/push-targets. */
export type PushTargets = {
  status: OrderStatus;
  prefs: AlertPreferences;
  subscriptions: PushSubscription[];
};

let vapidReady: boolean | null = null;

function configureVapid(): boolean {
  if (!PUSH_ENABLED) return false;
  if (vapidReady !== null) return vapidReady;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    console.warn("[push] VAPID keys are not set; browser push is off.");
    return (vapidReady = false);
  }
  webpush.setVapidDetails(process.env.VAPID_SUBJECT ?? "mailto:owner@hiatus.example", publicKey, privateKey);
  return (vapidReady = true);
}

/**
 * Who to notify about an order, read BEFORE its status changes so the
 * previous status is known. Null when the API can't say (not built yet,
 * unreachable): a status change must never fail because push couldn't load.
 */
export async function getPushTargets(orderId: string, token: string | undefined): Promise<PushTargets | null> {
  if (!configureVapid()) return null;
  return apiJson<PushTargets>(`/orders/${orderId}/push-targets`, { token }).catch(() => null);
}

/**
 * Sends the status-change push to every browser the customer enabled.
 * Uses the same shouldAlert() rule as the on-site alerts, so a customer
 * who turned "Order progress" off gets neither.
 */
export async function sendOrderPush(
  orderId: string,
  before: PushTargets,
  next: OrderStatus,
  token: string | undefined
): Promise<void> {
  if (!before.subscriptions.length || before.status === next) return;
  if (!shouldAlert(before.status, next, before.prefs) || !configureVapid()) return;

  const { templates } = await getSettings();
  const body: Record<OrderStatus, string> = {
    pending: templates.order_accepted,
    preparing: templates.order_preparing,
    ready: templates.order_ready,
    completed: templates.order_completed,
    cancelled: "This order was cancelled and will not be charged.",
  };

  const payload = JSON.stringify({
    title: `Order ${orderCode(orderId)}: ${STATUS_LABELS[next]}`,
    body: body[next],
    url: `/orders/${orderId}`,
    tag: `order-${orderId}`,
  });

  const results = await Promise.allSettled(
    before.subscriptions.map((sub) =>
      // TTL: a "ready" push that arrives an hour late is noise, not news.
      webpush.sendNotification(sub, payload, { TTL: 60 * 60, urgency: "high" })
    )
  );

  // 404/410 means the customer revoked permission or the browser dropped the
  // subscription; anything else (network, 5xx) is worth retrying next time.
  const gone = results.flatMap((r, i) =>
    r.status === "rejected" && [404, 410].includes((r.reason as { statusCode?: number }).statusCode ?? 0)
      ? [before.subscriptions[i].endpoint]
      : []
  );
  if (gone.length) {
    await apiJson("/push-subscriptions/prune", {
      method: "POST",
      token,
      body: JSON.stringify({ endpoints: gone }),
    }).catch(() => {});
  }
}

/** One test push straight to the browser that asked — no stored data involved. */
export async function sendTestPush(subscription: PushSubscription): Promise<void> {
  if (!configureVapid()) throw new Error("Browser notifications aren't set up on the server yet.");
  await webpush.sendNotification(
    subscription,
    JSON.stringify({
      title: "Hiatus Coffee",
      body: "Notifications are on. We'll tell you here when your order is ready.",
      url: "/orders",
      tag: "test",
    }),
    { TTL: 60 }
  );
}

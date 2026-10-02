"use server";

import { apiJson } from "@/lib/api-client";
import { getServerToken } from "@/lib/server-token";
import { sendTestPush } from "@/lib/push-server";
import { PUSH_ENABLED } from "@/lib/push-flag";

const NOT_AVAILABLE = { error: "Browser notifications aren't available yet." };

export type PushActionResult = { error: string | null };

/** The browser's subscription, as PushSubscription.toJSON() produces it. */
type SubscriptionJSON = { endpoint: string; keys: { p256dh: string; auth: string } };

function isSubscription(value: unknown): value is SubscriptionJSON {
  const v = value as SubscriptionJSON;
  return (
    typeof v?.endpoint === "string" &&
    v.endpoint.startsWith("https://") &&
    typeof v.keys?.p256dh === "string" &&
    typeof v.keys?.auth === "string"
  );
}

/** Stores this browser's subscription against the signed-in customer. */
export async function savePushSubscription(subscription: unknown, userAgent: string): Promise<PushActionResult> {
  if (!PUSH_ENABLED) return NOT_AVAILABLE;
  if (!isSubscription(subscription)) return { error: "That browser subscription isn't valid." };
  try {
    await apiJson("/account/push-subscriptions", {
      method: "POST",
      token: (await getServerToken()) ?? undefined,
      body: JSON.stringify({ ...subscription, user_agent: userAgent.slice(0, 200) }),
    });
    return { error: null };
  } catch (err: unknown) {
    return { error: (err as Error).message };
  }
}

export async function removePushSubscription(endpoint: string): Promise<PushActionResult> {
  try {
    await apiJson("/account/push-subscriptions", {
      method: "DELETE",
      token: (await getServerToken()) ?? undefined,
      body: JSON.stringify({ endpoint }),
    });
    return { error: null };
  } catch (err: unknown) {
    return { error: (err as Error).message };
  }
}

/**
 * Sends a test notification to the browser that asked. Signed-in customers
 * only, and only to the subscription they hand over — this can't be aimed at
 * anyone else's browser.
 */
export async function sendTestNotification(subscription: unknown): Promise<PushActionResult> {
  if (!PUSH_ENABLED) return NOT_AVAILABLE;
  if (!(await getServerToken())) return { error: "Log in to test notifications." };
  if (!isSubscription(subscription)) return { error: "That browser subscription isn't valid." };
  try {
    await sendTestPush(subscription);
    return { error: null };
  } catch (err: unknown) {
    return { error: (err as Error).message || "The test notification couldn't be sent." };
  }
}

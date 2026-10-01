"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { getServerToken } from "@/lib/server-token";
import { apiJson } from "@/lib/api-client";
import { getPushTargets, sendOrderPush } from "@/lib/push-server";
import type { OrderStatus, PaymentMethod } from "@/types/database";

export type ActionResult = { error: string | null };

async function token() {
  return (await getServerToken()) ?? undefined;
}

function revalidateOrderViews(orderId?: string) {
  revalidatePath("/staff");
  revalidatePath("/staff/pos");
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  revalidatePath("/orders");
  if (orderId) revalidatePath(`/orders/${orderId}`);
}

export async function advanceOrderStatus(orderId: string, newStatus: OrderStatus): Promise<ActionResult> {
  try {
    const auth = await token();
    // Read before the change so the push knows what the status moved from.
    const pushTargets = await getPushTargets(orderId, auth);
    await apiJson(`/orders/${orderId}/status`, { method: "PUT", token: auth, body: JSON.stringify({ status: newStatus }) });
    revalidateOrderViews(orderId);
    if (pushTargets) after(() => sendOrderPush(orderId, pushTargets, newStatus, auth));
    return { error: null };
  } catch (err: unknown) { return { error: (err as Error).message }; }
}

export async function setItemAvailability(itemId: string, available: boolean): Promise<ActionResult> {
  try {
    await apiJson(`/staff/menu/${itemId}/availability`, { method: "PUT", token: await token(), body: JSON.stringify({ available }) });
    revalidatePath("/staff/menu");
    revalidatePath("/admin/menu");
    revalidatePath("/");
    return { error: null };
  } catch (err: unknown) { return { error: (err as Error).message }; }
}

export async function assignTable(orderId: string, label: string): Promise<ActionResult> {
  try {
    await apiJson(`/orders/${orderId}/table`, { method: "POST", token: await token(), body: JSON.stringify({ label }) });
    revalidateOrderViews(orderId);
    return { error: null };
  } catch (err: unknown) { return { error: (err as Error).message }; }
}

export async function setOrderPriority(orderId: string, priority: number): Promise<ActionResult> {
  try {
    await apiJson(`/orders/${orderId}/priority`, { method: "POST", token: await token(), body: JSON.stringify({ priority }) });
    revalidatePath("/staff");
    return { error: null };
  } catch (err: unknown) { return { error: (err as Error).message }; }
}

export async function takePayment(orderId: string, method: PaymentMethod, amount: number | null, reference: string): Promise<ActionResult> {
  try {
    await apiJson(`/orders/${orderId}/payment`, { method: "POST", token: await token(), body: JSON.stringify({ method, amount, reference: reference || null, kind: "payment" }) });
    revalidateOrderViews(orderId);
    return { error: null };
  } catch (err: unknown) { return { error: (err as Error).message }; }
}

export async function refundOrder(orderId: string, amount: number | null, reason: string): Promise<ActionResult> {
  try {
    await apiJson(`/orders/${orderId}/payment`, { method: "POST", token: await token(), body: JSON.stringify({ amount, reason: reason || null, kind: "refund", method: "cash" }) });
    revalidateOrderViews(orderId);
    return { error: null };
  } catch (err: unknown) { return { error: (err as Error).message }; }
}

export async function voidOrder(orderId: string, reason: string): Promise<ActionResult> {
  try {
    await apiJson(`/orders/${orderId}/payment`, { method: "POST", token: await token(), body: JSON.stringify({ reason: reason || null, kind: "void", method: "cash" }) });
    revalidateOrderViews(orderId);
    return { error: null };
  } catch (err: unknown) { return { error: (err as Error).message }; }
}

export async function applyManualDiscount(orderId: string, amount: number, reason: string): Promise<ActionResult> {
  try {
    await apiJson(`/orders/${orderId}/discount`, { method: "POST", token: await token(), body: JSON.stringify({ amount, reason }) });
    revalidateOrderViews(orderId);
    return { error: null };
  } catch (err: unknown) { return { error: (err as Error).message }; }
}

export async function clockIn(openingCash: number): Promise<ActionResult> {
  try {
    await apiJson("/staff/clock-in", { method: "POST", token: await token(), body: JSON.stringify({ opening_cash: openingCash }) });
    revalidatePath("/staff/shift");
    revalidatePath("/staff");
    return { error: null };
  } catch (err: unknown) { return { error: (err as Error).message }; }
}

export async function clockOut(closingCash: number | null, note: string): Promise<ActionResult> {
  try {
    await apiJson("/staff/clock-out", { method: "POST", token: await token(), body: JSON.stringify({ closing_cash: closingCash, note: note || null }) });
    revalidatePath("/staff/shift");
    revalidatePath("/staff");
    return { error: null };
  } catch (err: unknown) { return { error: (err as Error).message }; }
}

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { OrderStatus, PaymentMethod } from "@/types/database";

/**
 * Counter operations.
 *
 * Every one of these is a thin wrapper over a security-definer RPC. None of
 * them checks the caller's role in TypeScript — the check lives in the SQL
 * function, which is the only place it cannot be bypassed by calling the
 * database directly with the same anon key. What these add is the Next.js
 * half: revalidating the pages whose data just changed.
 *
 * They return `{ error }` rather than throwing so the calling component can
 * show the message next to the control that failed. A barista holding a hot
 * drink should not get an error boundary.
 */

export type ActionResult = { error: string | null };

/**
 * The pages a counter action can invalidate.
 *
 * An order status change is visible in four places at once — the queue, the
 * POS, the admin order list, and the customer's own order page — and missing
 * one leaves a stale screen that someone will act on.
 */
function revalidateOrderViews(orderId?: string) {
  revalidatePath("/staff");
  revalidatePath("/staff/pos");
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  revalidatePath("/orders");
  if (orderId) revalidatePath(`/orders/${orderId}`);
}

export async function advanceOrderStatus(
  orderId: string,
  newStatus: OrderStatus
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("update_order_status", {
    target_order_id: orderId,
    new_status: newStatus,
  });

  revalidateOrderViews(orderId);
  return { error: error?.message ?? null };
}

export async function setItemAvailability(
  itemId: string,
  available: boolean
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_item_availability", {
    target_item_id: itemId,
    available,
  });

  revalidatePath("/staff/menu");
  revalidatePath("/admin/menu");
  // The storefront grid and every product page read is_available, so a drink
  // going sold-out has to clear the customer-facing cache too.
  revalidatePath("/");
  revalidatePath("/menu", "layout");
  return { error: error?.message ?? null };
}

export async function assignTable(
  orderId: string,
  label: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_order_table", {
    target_order_id: orderId,
    label,
  });

  revalidateOrderViews(orderId);
  return { error: error?.message ?? null };
}

export async function setOrderPriority(
  orderId: string,
  priority: number
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_order_priority", {
    target_order_id: orderId,
    new_priority: priority,
  });

  revalidatePath("/staff");
  return { error: error?.message ?? null };
}

/* ==========================================================================
   Point of sale
   ========================================================================== */

export async function takePayment(
  orderId: string,
  method: PaymentMethod,
  amount: number | null,
  reference: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("record_payment", {
    target_order_id: orderId,
    pay_method: method,
    // Null means "the order total", which the RPC fills in. Sending a number
    // the client computed would reintroduce exactly the tampering the
    // server-side pricing exists to prevent.
    pay_amount: amount,
    pay_reference: reference || null,
  });

  revalidateOrderViews(orderId);
  return { error: error?.message ?? null };
}

export async function refundOrder(
  orderId: string,
  amount: number | null,
  reason: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("refund_payment", {
    target_order_id: orderId,
    refund_amount: amount,
    refund_reason: reason || null,
  });

  revalidateOrderViews(orderId);
  return { error: error?.message ?? null };
}

export async function voidOrder(
  orderId: string,
  reason: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("void_order", {
    target_order_id: orderId,
    void_reason: reason || null,
  });

  revalidateOrderViews(orderId);
  return { error: error?.message ?? null };
}

export async function applyManualDiscount(
  orderId: string,
  amount: number,
  reason: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("apply_manual_discount", {
    target_order_id: orderId,
    extra_discount: amount,
    reason,
  });

  revalidateOrderViews(orderId);
  return { error: error?.message ?? null };
}

/* ==========================================================================
   Shifts
   ========================================================================== */

export async function clockIn(openingCash: number): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("clock_in", { opening: openingCash });

  revalidatePath("/staff/shift");
  revalidatePath("/staff");
  return { error: error?.message ?? null };
}

export async function clockOut(
  closingCash: number | null,
  note: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("clock_out", {
    closing: closingCash,
    shift_note: note || null,
  });

  revalidatePath("/staff/shift");
  revalidatePath("/staff");
  return { error: error?.message ?? null };
}

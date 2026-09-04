"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { OrderStatus, OrderType, PaymentMethod } from "@/types/database";
import type { DrinkSize } from "@/lib/sizes";

export type PlaceOrderInput = {
  items: { menuItemId: string; quantity: number; size: DrinkSize }[];
  pickupNote: string;
  orderType: OrderType;
  paymentMethod: PaymentMethod;
  promoCode: string;
  tableLabel: string;
};

/**
 * Places an order.
 *
 * Note what is NOT sent: no prices, no subtotal, no discount amount. The
 * client sends choices — which drink, what size, which code — and
 * `create_order` derives every number from the menu and from `evaluate_promo`
 * on the server. That is the whole reason ordering goes through an RPC rather
 * than an insert.
 *
 * An invalid promo code raises inside the function, which surfaces here as an
 * error message rather than an order silently placed at full price. Quietly
 * dropping the discount would be worse than refusing: the customer agreed to
 * one total and would be charged another.
 */
export async function placeOrder(
  input: PlaceOrderInput
): Promise<{ orderId: string | null; error: string | null }> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("create_order", {
    items: input.items.map((i) => ({
      menu_item_id: i.menuItemId,
      quantity: i.quantity,
      size: i.size,
    })),
    pickup_note: input.pickupNote || null,
    order_type: input.orderType,
    payment_method: input.paymentMethod,
    promo_code: input.promoCode || null,
    table_label: input.tableLabel || null,
  });

  if (error) {
    return { orderId: null, error: error.message };
  }

  revalidatePath("/orders");
  // The new ticket has to appear on the counter's screens too.
  revalidatePath("/staff");
  revalidatePath("/staff/pos");
  revalidatePath("/admin/orders");

  return { orderId: data as string, error: null };
}

export async function cancelOrder(orderId: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_order", { target_order_id: orderId });

  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/staff");
  return { error: error?.message ?? null };
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("update_order_status", {
    target_order_id: orderId,
    new_status: newStatus,
  });

  revalidatePath("/admin/orders");
  revalidatePath("/staff");
  revalidatePath(`/orders/${orderId}`);
  return { error: error?.message ?? null };
}

export async function submitRating(
  orderId: string,
  menuItemId: string,
  rating: number,
  comment: string
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "You must be logged in to leave a rating." };

  const { error } = await supabase.from("ratings").insert({
    user_id: user.id,
    order_id: orderId,
    menu_item_id: menuItemId,
    rating,
    comment: comment || null,
  });

  revalidatePath(`/orders/${orderId}`);
  // A new rating changes the storefront's featured order, which is ranked by
  // average score.
  revalidatePath("/");
  return { error: error?.message ?? null };
}

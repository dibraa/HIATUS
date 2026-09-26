"use server";

import { revalidatePath } from "next/cache";
import { getServerToken } from "@/lib/supabase/server";
import { apiJson } from "@/lib/api-client";
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

export async function placeOrder(
  input: PlaceOrderInput
): Promise<{ orderId: string | null; error: string | null }> {
  const token = await getServerToken();
  try {
    const data = await apiJson<{ orderId: string }>("/orders", {
      method: "POST",
      token: token ?? undefined,
      body: JSON.stringify({
        items: input.items.map((i) => ({ menu_item_id: i.menuItemId, quantity: i.quantity, size: i.size })),
        pickup_note: input.pickupNote || null,
        order_type: input.orderType,
        payment_method: input.paymentMethod,
        promo_code: input.promoCode || null,
        table_label: input.tableLabel || null,
      }),
    });
    revalidatePath("/orders");
    revalidatePath("/staff");
    revalidatePath("/admin/orders");
    return { orderId: data.orderId, error: null };
  } catch (err: unknown) {
    return { orderId: null, error: (err as Error).message };
  }
}

export async function cancelOrder(orderId: string): Promise<{ error: string | null }> {
  const token = await getServerToken();
  try {
    await apiJson(`/orders/${orderId}/cancel`, { method: "POST", token: token ?? undefined });
    revalidatePath("/orders");
    revalidatePath(`/orders/${orderId}`);
    return { error: null };
  } catch (err: unknown) {
    return { error: (err as Error).message };
  }
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus
): Promise<{ error: string | null }> {
  const token = await getServerToken();
  try {
    await apiJson(`/orders/${orderId}/status`, {
      method: "PUT",
      token: token ?? undefined,
      body: JSON.stringify({ status: newStatus }),
    });
    revalidatePath("/admin/orders");
    revalidatePath("/staff");
    revalidatePath(`/orders/${orderId}`);
    return { error: null };
  } catch (err: unknown) {
    return { error: (err as Error).message };
  }
}

export async function submitRating(
  orderId: string,
  menuItemId: string,
  rating: number,
  comment: string
): Promise<{ error: string | null }> {
  const token = await getServerToken();
  try {
    await apiJson(`/orders/${orderId}/rating`, {
      method: "POST",
      token: token ?? undefined,
      body: JSON.stringify({ menu_item_id: menuItemId, rating, comment }),
    });
    revalidatePath(`/orders/${orderId}`);
    revalidatePath("/");
    return { error: null };
  } catch (err: unknown) {
    return { error: (err as Error).message };
  }
}

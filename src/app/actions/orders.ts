"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { OrderStatus } from "@/types/database";
import type { DrinkSize } from "@/lib/sizes";

export async function placeOrder(
  items: { menuItemId: string; quantity: number; size: DrinkSize }[],
  pickupNote: string
): Promise<{ orderId: string | null; error: string | null }> {
  const supabase = await createClient();

  // `size` is sent per line so `create_order` can apply the size price delta
  // itself. Pricing stays server-derived — the client sends the choice, never
  // the price. Requires supabase/patches/001_size_pricing.sql; the pre-patch
  // function simply ignores the extra key and prices everything as medium.
  const { data, error } = await supabase.rpc("create_order", {
    items: items.map((i) => ({
      menu_item_id: i.menuItemId,
      quantity: i.quantity,
      size: i.size,
    })),
    pickup_note: pickupNote || null,
  });

  if (error) {
    return { orderId: null, error: error.message };
  }

  revalidatePath("/orders");
  return { orderId: data as string, error: null };
}

export async function cancelOrder(orderId: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_order", { target_order_id: orderId });

  revalidatePath("/orders");
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
  return { error: error?.message ?? null };
}

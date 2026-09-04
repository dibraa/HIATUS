"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { DrinkSize } from "@/lib/sizes";

export type AccountResult = { error: string | null };
export type PreferencesState = { error: string | null; success: boolean };

/**
 * A customer's own data: favourites, saved presets, notification preferences.
 *
 * None of this goes through an RPC. Every table here is gated by a plain
 * `user_id = auth.uid()` policy, which already says the whole rule — there is
 * no price to re-derive, no role to check, and no other person's row in reach.
 * A security-definer function would add ceremony without adding a guarantee.
 *
 * Each action still resolves the user server-side rather than accepting an id
 * from the client. Even with RLS as the real backstop, sending your own user id
 * from the browser is a habit that eventually gets copied somewhere it matters.
 */

export async function toggleFavorite(
  menuItemId: string,
  isFavorite: boolean
): Promise<AccountResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Log in to save favourites." };

  const { error } = isFavorite
    ? await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("menu_item_id", menuItemId)
    : // upsert, not insert: the composite primary key makes a repeat tap a
      // no-op rather than a duplicate-key error the customer would see.
      await supabase
        .from("favorites")
        .upsert({ user_id: user.id, menu_item_id: menuItemId });

  revalidatePath("/favorites");
  revalidatePath(`/menu/${menuItemId}`);
  return { error: error?.message ?? null };
}

export async function savePreset(
  name: string,
  lines: { menu_item_id: string; quantity: number; size: DrinkSize }[]
): Promise<AccountResult> {
  const trimmed = name.trim();
  if (!trimmed) return { error: "Give the preset a name." };
  if (lines.length === 0) return { error: "There is nothing to save." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Log in to save an order." };

  // Only the three fields create_order needs are stored. Prices deliberately
  // are not: a preset saved in March must be charged at today's menu price,
  // and create_order re-derives every line anyway.
  const { error } = await supabase.from("order_presets").insert({
    user_id: user.id,
    name: trimmed.slice(0, 60),
    lines: lines.map((l) => ({
      menu_item_id: l.menu_item_id,
      quantity: l.quantity,
      size: l.size,
    })),
  });

  revalidatePath("/favorites");
  return { error: error?.message ?? null };
}

export async function deletePreset(id: string): Promise<AccountResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("order_presets").delete().eq("id", id);

  revalidatePath("/favorites");
  return { error: error?.message ?? null };
}

export async function saveNotificationPreferences(
  _prev: PreferencesState,
  formData: FormData
): Promise<PreferencesState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not logged in.", success: false };

  const { error } = await supabase.from("notification_preferences").upsert({
    user_id: user.id,
    order_updates: formData.get("order_updates") === "on",
    ready_alerts: formData.get("ready_alerts") === "on",
    promotions: formData.get("promotions") === "on",
    email_channel: formData.get("email_channel") === "on",
    sms_channel: formData.get("sms_channel") === "on",
    updated_at: new Date().toISOString(),
  });

  if (error) return { error: error.message, success: false };

  revalidatePath("/profile");
  return { error: null, success: true };
}

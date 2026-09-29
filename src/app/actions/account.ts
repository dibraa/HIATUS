"use server";

import { revalidatePath } from "next/cache";
import { getServerToken } from "@/lib/server-token";
import { apiJson } from "@/lib/api-client";
import type { DrinkSize } from "@/lib/sizes";

export type AccountResult = { error: string | null };
export type PreferencesState = { error: string | null; success: boolean };

async function tok() { return (await getServerToken()) ?? undefined; }

export async function toggleFavorite(menuItemId: string, isFavorite: boolean): Promise<AccountResult> {
  try {
    if (isFavorite) await apiJson(`/account/favorites/${menuItemId}`, { method: "DELETE", token: await tok() });
    else await apiJson(`/account/favorites/${menuItemId}`, { method: "POST", token: await tok() });
    revalidatePath("/favorites");
    revalidatePath(`/menu/${menuItemId}`);
    return { error: null };
  } catch (err: unknown) { return { error: (err as Error).message }; }
}

export async function savePreset(
  name: string,
  lines: { menu_item_id: string; quantity: number; size: DrinkSize }[]
): Promise<AccountResult> {
  const trimmed = name.trim();
  if (!trimmed) return { error: "Give the preset a name." };
  if (lines.length === 0) return { error: "There is nothing to save." };
  try {
    await apiJson("/account/presets", { method: "POST", token: await tok(), body: JSON.stringify({ name: trimmed.slice(0, 60), lines }) });
    revalidatePath("/favorites");
    return { error: null };
  } catch (err: unknown) { return { error: (err as Error).message }; }
}

export async function deletePreset(id: string): Promise<AccountResult> {
  try {
    await apiJson(`/account/presets/${id}`, { method: "DELETE", token: await tok() });
    revalidatePath("/favorites");
    return { error: null };
  } catch (err: unknown) { return { error: (err as Error).message }; }
}

export async function saveNotificationPreferences(
  _prev: PreferencesState,
  formData: FormData
): Promise<PreferencesState> {
  try {
    await apiJson("/account/notifications", {
      method: "PUT",
      token: await tok(),
      body: JSON.stringify({
        order_updates: formData.get("order_updates") === "on",
        ready_alerts: formData.get("ready_alerts") === "on",
        email_channel: formData.get("email_channel") === "on",
        sms_channel: formData.get("sms_channel") === "on",
      }),
    });
    revalidatePath("/profile");
    return { error: null, success: true };
  } catch (err: unknown) { return { error: (err as Error).message, success: false }; }
}

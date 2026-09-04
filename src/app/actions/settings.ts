"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { BusinessHours } from "@/types/database";

export type SettingsState = { error: string | null; success: string | null };

/**
 * Writes to `app_settings`, one key at a time, through `set_setting`.
 *
 * The RPC exists to keep `updated_at` honest and to log the change; the
 * admin-only RLS policy is what actually restricts it. Each form here owns one
 * key, so saving the opening hours can never clobber the payment methods —
 * which is exactly what a single "save all settings" action would risk on a
 * page with two forms open in two tabs.
 */
async function writeSetting(
  key: string,
  value: unknown,
  revalidate: string[] = []
): Promise<SettingsState> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_setting", {
    setting_key: key,
    setting_value: value,
  });

  if (error) return { error: error.message, success: null };

  revalidatePath("/admin/settings");
  // Hours and tenders are rendered on the storefront and at checkout, so those
  // caches have to go too or the change is invisible where it matters.
  for (const path of revalidate) revalidatePath(path);

  return { error: null, success: "Saved." };
}

export async function saveBusinessHours(
  _prev: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const hours: BusinessHours[] = days.map((label, day) => ({
    day,
    label,
    // Defaults are applied here rather than trusting the inputs, so a browser
    // that submits an empty time field cannot store "" as an opening time.
    open: String(formData.get(`open-${day}`) ?? "").trim() || "08:00",
    close: String(formData.get(`close-${day}`) ?? "").trim() || "18:00",
    closed: formData.get(`closed-${day}`) === "on",
  }));

  return writeSetting("business_hours", hours, ["/", "/checkout"]);
}

export async function savePaymentMethods(
  _prev: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const methods = {
    cash: formData.get("cash") === "on",
    card: formData.get("card") === "on",
    ewallet: formData.get("ewallet") === "on",
  };

  // Turning off every tender leaves a checkout with no way to pay, which the
  // customer discovers as a dead end rather than as a message.
  if (!methods.cash && !methods.card && !methods.ewallet) {
    return { error: "At least one payment method has to stay switched on.", success: null };
  }

  return writeSetting("payment_methods", methods, ["/checkout"]);
}

export async function saveOrderingSettings(
  _prev: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const prepMinutes = Number(formData.get("default_prep_minutes"));

  const ordering = {
    accepting_orders: formData.get("accepting_orders") === "on",
    default_prep_minutes:
      Number.isFinite(prepMinutes) && prepMinutes > 0 ? Math.round(prepMinutes) : 10,
    dine_in_enabled: formData.get("dine_in_enabled") === "on",
    takeout_enabled: formData.get("takeout_enabled") === "on",
  };

  if (!ordering.dine_in_enabled && !ordering.takeout_enabled) {
    return {
      error: "Keep at least one of dine-in or takeout switched on.",
      success: null,
    };
  }

  return writeSetting("ordering", ordering, ["/", "/checkout"]);
}

export async function saveShopInfo(
  _prev: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const info = {
    name: String(formData.get("name") ?? "").trim() || "Hiatus Coffee",
    tagline: String(formData.get("tagline") ?? "").trim(),
    address: String(formData.get("address") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
  };

  return writeSetting("shop_info", info, ["/"]);
}

export async function saveNotificationTemplates(
  _prev: SettingsState,
  formData: FormData
): Promise<SettingsState> {
  const templates = {
    order_accepted: String(formData.get("order_accepted") ?? "").trim(),
    order_preparing: String(formData.get("order_preparing") ?? "").trim(),
    order_ready: String(formData.get("order_ready") ?? "").trim(),
    order_completed: String(formData.get("order_completed") ?? "").trim(),
  };

  if (Object.values(templates).some((t) => t === "")) {
    return { error: "Every message needs some wording.", success: null };
  }

  return writeSetting("notification_templates", templates, ["/orders"]);
}

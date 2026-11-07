"use server";

import { revalidatePath } from "next/cache";
import { getServerToken } from "@/lib/server-token";
import { apiJson } from "@/lib/api-client";
import type { BusinessHours } from "@/types/database";

export type SettingsState = { error: string | null; success: string | null; version?: number };

export async function saveIntegrationSettings(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  return writeSetting("integrations", {
    ...Object.fromEntries(["resend", "cloudinary", "maps", "onesignal", "posthog", "sentry"].map(name => [name + "_enabled", formData.get(name + "_enabled") === "on"])),
    email_provider: String(formData.get("email_provider") || "smtp"),
    push_provider: String(formData.get("push_provider") || "native"),
    report_export_enabled: formData.get("report_export_enabled") === "on",
    push_enabled: formData.get("push_enabled") === "on",
    password_email_enabled: formData.get("password_email_enabled") === "on",
  }, ["/admin/reports"]);
}

export async function saveReceiptSettings(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  return writeSetting("receipts", { enabled: formData.get("enabled") === "on" });
}

export async function saveAuthenticationSettings(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  return writeSetting("authentication", {
    google_enabled: formData.get("google_enabled") === "on",
    recaptcha_enabled: formData.get("recaptcha_enabled") === "on",
  }, ["/login", "/signup"]);
}

async function writeSetting(key: string, value: unknown, revalidate: string[] = [], version?: number): Promise<SettingsState> {
  const token = await getServerToken();
  try {
    const saved = await apiJson<{ version?: number }>(`/settings/${key}`, { method: "PUT", token: token ?? undefined, body: JSON.stringify({ value, version }) });
    revalidatePath("/admin/settings");
    for (const path of revalidate) revalidatePath(path);
    revalidatePath("/", "layout");
    return { error: null, success: "Saved.", version: saved.version };
  } catch (err: unknown) {
    return { error: (err as Error).message, success: null };
  }
}

export async function saveBusinessHours(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const hours: BusinessHours[] = days.map((label, day) => ({
    day, label,
    open: String(formData.get(`open-${day}`) ?? "").trim() || "08:00",
    close: String(formData.get(`close-${day}`) ?? "").trim() || "18:00",
    closed: formData.get(`closed-${day}`) === "on",
  }));
  return writeSetting("business_hours", hours, ["/", "/checkout"], Number(formData.get("version")));
}

export async function savePaymentMethods(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  const methods = { cash: true, ewallet: false };

  return writeSetting("payment_methods", methods, ["/checkout"], Number(formData.get("version")));
}

export async function saveOrderingSettings(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  const prepMinutes = Number(formData.get("default_prep_minutes"));
  const ordering = {
    accepting_orders: formData.get("accepting_orders") === "on",
    default_prep_minutes: Number.isFinite(prepMinutes) && prepMinutes > 0 ? Math.round(prepMinutes) : 10,
    dine_in_enabled: formData.get("dine_in_enabled") === "on",
    takeout_enabled: formData.get("takeout_enabled") === "on",
  };
  if (!ordering.dine_in_enabled && !ordering.takeout_enabled)
    return { error: "Keep at least one of dine-in or takeout switched on.", success: null };
  return writeSetting("ordering", ordering, ["/", "/checkout"], Number(formData.get("version")));
}

export async function saveShopInfo(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  const info = {
    name: String(formData.get("name") ?? "").trim() || "Hiatus Coffee",
    tagline: String(formData.get("tagline") ?? "").trim(),
    address: String(formData.get("address") ?? "").trim(),
    phone: String(formData.get("phone") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
  };
  return writeSetting("shop_info", info, ["/"], Number(formData.get("version")));
}

export async function saveNotificationTemplates(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  const templates = {
    order_accepted: String(formData.get("order_accepted") ?? "").trim(),
    order_preparing: String(formData.get("order_preparing") ?? "").trim(),
    order_ready: String(formData.get("order_ready") ?? "").trim(),
    order_completed: String(formData.get("order_completed") ?? "").trim(),
  };
  if (Object.values(templates).some((t) => t === ""))
    return { error: "Every message needs some wording.", success: null };
  return writeSetting("notification_templates", templates, ["/orders"]);
}

export async function saveNotifications(_prev: SettingsState, formData: FormData): Promise<SettingsState> {
  try { return writeSetting("notifications", JSON.parse(String(formData.get("notifications"))), ["/orders", "/staff"], Number(formData.get("version"))); }
  catch { return { error: "Check notification settings and try again.", success: null }; }
}

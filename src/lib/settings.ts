import { apiJson } from "@/lib/api-client";
import type {
  BusinessHours,
  NotificationTemplates,
  OrderingSettings,
  PaymentMethodSettings,
  ShopInfo,
} from "@/types/database";

export const DEFAULT_BUSINESS_HOURS: BusinessHours[] = [
  { day: 0, label: "Sunday", open: "08:00", close: "18:00", closed: false },
  { day: 1, label: "Monday", open: "07:00", close: "20:00", closed: false },
  { day: 2, label: "Tuesday", open: "07:00", close: "20:00", closed: false },
  { day: 3, label: "Wednesday", open: "07:00", close: "20:00", closed: false },
  { day: 4, label: "Thursday", open: "07:00", close: "20:00", closed: false },
  { day: 5, label: "Friday", open: "07:00", close: "22:00", closed: false },
  { day: 6, label: "Saturday", open: "08:00", close: "22:00", closed: false },
];

export const DEFAULT_PAYMENT_METHODS: PaymentMethodSettings = { cash: true, card: true, ewallet: true };
export const DEFAULT_ORDERING: OrderingSettings = { accepting_orders: true, default_prep_minutes: 10, dine_in_enabled: true, takeout_enabled: true };
export const DEFAULT_SHOP_INFO: ShopInfo = { name: "Hiatus Coffee", tagline: "Slow moments, served warm.", address: "", phone: "", email: "" };
export const DEFAULT_NOTIFICATION_TEMPLATES: NotificationTemplates = {
  order_accepted: "We have your order and will start it shortly.",
  order_preparing: "Your order is being made now.",
  order_ready: "Your order is ready on the counter.",
  order_completed: "Thanks for ordering — see you next time.",
};

function coerceObject<T extends object>(value: unknown, fallback: T): T {
  if (!value || typeof value !== "object" || Array.isArray(value)) return fallback;
  return { ...fallback, ...(value as Partial<T>) };
}

function coerceArray<T>(value: unknown, fallback: T[]): T[] {
  if (!Array.isArray(value) || value.length === 0) return fallback;
  return value as T[];
}

export async function getSettings() {
  try {
    const all = await apiJson<Record<string, unknown>>("/settings");
    return {
      businessHours: coerceArray(all["business_hours"], DEFAULT_BUSINESS_HOURS),
      paymentMethods: coerceObject(all["payment_methods"], DEFAULT_PAYMENT_METHODS),
      ordering: coerceObject(all["ordering"], DEFAULT_ORDERING),
      shopInfo: coerceObject(all["shop_info"], DEFAULT_SHOP_INFO),
      templates: coerceObject(all["notification_templates"], DEFAULT_NOTIFICATION_TEMPLATES),
    };
  } catch {
    return {
      businessHours: DEFAULT_BUSINESS_HOURS,
      paymentMethods: DEFAULT_PAYMENT_METHODS,
      ordering: DEFAULT_ORDERING,
      shopInfo: DEFAULT_SHOP_INFO,
      templates: DEFAULT_NOTIFICATION_TEMPLATES,
    };
  }
}

export function isOpenNow(
  hours: BusinessHours[],
  timeZone = "Asia/Manila",
  now = new Date()
): { open: boolean; today: BusinessHours | null } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const weekdayIndex = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));

  const today = hours.find((h) => h.day === weekdayIndex) ?? null;
  if (!today || today.closed) return { open: false, today };

  const current = `${get("hour") === "24" ? "00" : get("hour")}:${get("minute")}`;
  const overnight = today.close <= today.open;
  const open = overnight
    ? current >= today.open || current < today.close
    : current >= today.open && current < today.close;

  return { open, today };
}

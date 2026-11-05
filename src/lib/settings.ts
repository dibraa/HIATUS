import { apiJson } from "@/lib/api-client";
import type {
  BusinessHours,
  NotificationTemplates,
  OrderingSettings,
  PaymentMethodSettings,
  ShopInfo,
  OrderStatus,
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

export const DEFAULT_PAYMENT_METHODS: PaymentMethodSettings = { cash: true, ewallet: false };
export const DEFAULT_ORDERING: OrderingSettings = { accepting_orders: true, default_prep_minutes: 10, dine_in_enabled: true, takeout_enabled: true };
export const DEFAULT_SHOP_INFO: ShopInfo = { name: "Hiatus Coffee", tagline: "Slow moments, served warm.", address: "", phone: "", email: "" };
export const DEFAULT_NOTIFICATION_TEMPLATES: NotificationTemplates = {
  order_accepted: "We have your order and will start it shortly.",
  order_preparing: "Your order is being made now.",
  order_ready: "Your order is ready on the counter.",
  order_completed: "Thanks for ordering — see you next time.",
};
export type NotificationPolicy = Record<OrderStatus, { in_app: boolean; push: boolean; message: string }>;
export type Availability = { open: boolean; can_order: boolean; closes_at?: string | null; next_open_at: string | null; checked_at: string };
export const DEFAULT_NOTIFICATIONS: NotificationPolicy = Object.fromEntries(Object.entries({ pending: DEFAULT_NOTIFICATION_TEMPLATES.order_accepted, preparing: DEFAULT_NOTIFICATION_TEMPLATES.order_preparing, ready: DEFAULT_NOTIFICATION_TEMPLATES.order_ready, completed: DEFAULT_NOTIFICATION_TEMPLATES.order_completed, cancelled: "This order has been cancelled." }).map(([key, message]) => [key, { in_app: true, push: key !== "completed", message }])) as NotificationPolicy;

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
    const all = await apiJson<Record<string, unknown>>("/settings", { cache: "no-store" });
    return {
      businessHours: coerceArray(all["business_hours"], DEFAULT_BUSINESS_HOURS),
      paymentMethods: DEFAULT_PAYMENT_METHODS,
      ordering: coerceObject(all["ordering"], DEFAULT_ORDERING),
      shopInfo: coerceObject(all["shop_info"], DEFAULT_SHOP_INFO),
      templates: coerceObject(all["notification_templates"], DEFAULT_NOTIFICATION_TEMPLATES),
      notifications: coerceObject(all.notifications, DEFAULT_NOTIFICATIONS),
      versions: (all._versions || {}) as Record<string, number>,
      availability: all.availability as Availability | undefined,
      loaded: true,
    };
  } catch {
    return {
      businessHours: [] as BusinessHours[],
      paymentMethods: DEFAULT_PAYMENT_METHODS,
      ordering: DEFAULT_ORDERING,
      shopInfo: DEFAULT_SHOP_INFO,
      templates: DEFAULT_NOTIFICATION_TEMPLATES,
      notifications: DEFAULT_NOTIFICATIONS,
      versions: {} as Record<string, number>,
      availability: { open: false, can_order: false, next_open_at: null, checked_at: new Date().toISOString() } as Availability,
      loaded: false,
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

  const current = `${get("hour") === "24" ? "00" : get("hour")}:${get("minute")}`;
  const previous = hours.find(h => h.day === (weekdayIndex + 6) % 7);
  const carry = previous && !previous.closed && previous.close < previous.open && current < previous.close;
  const own = today && !today.closed && current >= today.open && (today.close < today.open || current < today.close);
  const open = Boolean(carry || own);

  const previousEndsLater = carry && today && previous && today.close > today.open && previous.close > today.close;
  return { open, today: carry && (!own || previousEndsLater) ? previous ?? today : today };
}

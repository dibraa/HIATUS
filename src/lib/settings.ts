import { createClient } from "@/lib/supabase/server";
import type {
  BusinessHours,
  NotificationTemplates,
  OrderingSettings,
  PaymentMethodSettings,
  ShopInfo,
} from "@/types/database";

/**
 * Reads `app_settings` — the key/value table patch 006 creates.
 *
 * Every getter takes a DEFAULT and returns it when the row is missing or
 * malformed. That is the important behaviour here: settings are read on the
 * storefront's hot path, and a shop that has not run patch 006 yet, or has
 * hand-edited a JSON value into something unparseable, must still get a
 * working checkout rather than a crashed page. A setting is a preference, and
 * a missing preference is not an error.
 *
 * The table is world-readable by design (opening hours and accepted tenders
 * have to render for a logged-out visitor), so these run under the anon key
 * with no privilege escalation.
 */

export const DEFAULT_BUSINESS_HOURS: BusinessHours[] = [
  { day: 0, label: "Sunday", open: "08:00", close: "18:00", closed: false },
  { day: 1, label: "Monday", open: "07:00", close: "20:00", closed: false },
  { day: 2, label: "Tuesday", open: "07:00", close: "20:00", closed: false },
  { day: 3, label: "Wednesday", open: "07:00", close: "20:00", closed: false },
  { day: 4, label: "Thursday", open: "07:00", close: "20:00", closed: false },
  { day: 5, label: "Friday", open: "07:00", close: "22:00", closed: false },
  { day: 6, label: "Saturday", open: "08:00", close: "22:00", closed: false },
];

export const DEFAULT_PAYMENT_METHODS: PaymentMethodSettings = {
  cash: true,
  card: true,
  ewallet: true,
};

export const DEFAULT_ORDERING: OrderingSettings = {
  accepting_orders: true,
  default_prep_minutes: 10,
  dine_in_enabled: true,
  takeout_enabled: true,
};

export const DEFAULT_SHOP_INFO: ShopInfo = {
  name: "Hiatus Coffee",
  tagline: "Slow moments, served warm.",
  address: "",
  phone: "",
  email: "",
};

export const DEFAULT_NOTIFICATION_TEMPLATES: NotificationTemplates = {
  order_accepted: "We have your order and will start it shortly.",
  order_preparing: "Your order is being made now.",
  order_ready: "Your order is ready on the counter.",
  order_completed: "Thanks for ordering — see you next time.",
};

/**
 * Fetches several settings in one round trip.
 *
 * One query for the whole set rather than a call per key: the checkout page
 * needs three of these at once, and three sequential round trips to Supabase
 * is a visible delay on a page whose whole job is to be fast.
 */
export async function getSettings(): Promise<{
  businessHours: BusinessHours[];
  paymentMethods: PaymentMethodSettings;
  ordering: OrderingSettings;
  shopInfo: ShopInfo;
  templates: NotificationTemplates;
}> {
  const supabase = await createClient();
  const { data } = await supabase.from("app_settings").select("key, value");

  const rows = new Map((data ?? []).map((r) => [r.key as string, r.value]));

  return {
    businessHours: coerceArray(rows.get("business_hours"), DEFAULT_BUSINESS_HOURS),
    paymentMethods: coerceObject(rows.get("payment_methods"), DEFAULT_PAYMENT_METHODS),
    ordering: coerceObject(rows.get("ordering"), DEFAULT_ORDERING),
    shopInfo: coerceObject(rows.get("shop_info"), DEFAULT_SHOP_INFO),
    templates: coerceObject(rows.get("notification_templates"), DEFAULT_NOTIFICATION_TEMPLATES),
  };
}

/**
 * Merges the stored object over the default rather than replacing it, so a
 * setting saved before a new key existed does not leave that key undefined.
 * Adding `dine_in_enabled` to the ordering settings must not break every shop
 * that saved theirs last week.
 */
function coerceObject<T extends object>(value: unknown, fallback: T): T {
  if (!value || typeof value !== "object" || Array.isArray(value)) return fallback;
  return { ...fallback, ...(value as Partial<T>) };
}

function coerceArray<T>(value: unknown, fallback: T[]): T[] {
  if (!Array.isArray(value) || value.length === 0) return fallback;
  return value as T[];
}

/**
 * Whether the shop is open right now, per its own clock.
 *
 * `timeZone` matters: the server runs in UTC, and asking it what day it is
 * would close a Manila shop eight hours early. `en-CA` is used for the date
 * parts only because it formats as ISO-like `YYYY-MM-DD`, which is trivially
 * comparable — no locale text is shown to anyone from this function.
 *
 * Closing times at or before opening (a bar open until 2am) are treated as
 * spilling past midnight rather than as an invalid range.
 */
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
  const weekdayIndex = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(
    get("weekday")
  );

  const today = hours.find((h) => h.day === weekdayIndex) ?? null;
  if (!today || today.closed) return { open: false, today };

  // "24" is a legal hour value from a 24-hour formatter at midnight.
  const current = `${get("hour") === "24" ? "00" : get("hour")}:${get("minute")}`;

  const overnight = today.close <= today.open;
  const open = overnight
    ? current >= today.open || current < today.close
    : current >= today.open && current < today.close;

  return { open, today };
}

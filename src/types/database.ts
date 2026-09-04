export type OrderStatus = "pending" | "preparing" | "ready" | "completed" | "cancelled";

/**
 * Three roles, in increasing order of authority. An admin can do everything a
 * staff member can — nothing in the app checks `role === "staff"` to authorise
 * counter work, it asks `isStaff()` (see src/lib/roles.ts), which is what keeps
 * an owner from being locked out of their own queue.
 */
export type Role = "customer" | "staff" | "admin";

export type OrderType = "dine_in" | "takeout";
export type PaymentMethod = "cash" | "card" | "ewallet";
export type PaymentStatus = "unpaid" | "paid" | "refunded" | "voided";

export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: Role;
  /** False revokes access without deleting the account or its order history. */
  is_active: boolean;
  created_at: string;
};

export type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  flavor: string;
  category: string;
  price: number;
  image_url: string | null;
  is_available: boolean;
  created_at: string;
};

export type Order = {
  id: string;
  user_id: string;
  status: OrderStatus;
  /** Sum of the lines, before any discount. */
  subtotal_amount: number;
  /** Promo plus any manual discount. Always >= 0. */
  discount_amount: number;
  /** What the customer owes: subtotal_amount - discount_amount. */
  total_amount: number;
  pickup_note: string | null;
  order_type: OrderType;
  table_label: string | null;
  priority: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  paid_at: string | null;
  promotion_id: string | null;
  promo_code: string | null;
  /** First time the order reached `ready`. Never overwritten. */
  ready_at: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  menu_item_id: string | null;
  item_name: string;
  flavor: string;
  /**
   * Drink size ordered. Optional because the column only exists once
   * supabase/patches/001_size_pricing.sql has been run, and is null on rows
   * created before it — read a missing value as medium.
   */
  size?: "S" | "M" | "L" | null;
  unit_price: number;
  quantity: number;
  subtotal: number;
};

export type Rating = {
  id: string;
  user_id: string;
  menu_item_id: string;
  order_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

/* ==========================================================================
   Staff
   ========================================================================== */

export type StaffActivity = {
  id: string;
  staff_id: string;
  action: string;
  subject_id: string | null;
  detail: string | null;
  created_at: string;
};

export type Shift = {
  id: string;
  staff_id: string;
  started_at: string;
  ended_at: string | null;
  opening_cash: number;
  closing_cash: number | null;
  note: string | null;
};

/** One row of `shift_report()` — the drawer count, per tender. */
export type ShiftReportRow = {
  method: PaymentMethod;
  payments_count: number;
  payments_total: number;
  refunds_total: number;
  net_total: number;
};

/** One row of `list_team()`. Carries the email, which RLS cannot reach. */
export type TeamMember = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: Role;
  is_active: boolean;
  created_at: string;
  on_shift: boolean;
};

/* ==========================================================================
   Money
   ========================================================================== */

/**
 * The payment ledger is append-only. `amount` is always positive — the sign
 * lives in `kind`, so a careless SUM cannot net a refund against a payment.
 */
export type Payment = {
  id: string;
  order_id: string;
  staff_id: string | null;
  kind: "payment" | "refund" | "void";
  method: PaymentMethod;
  amount: number;
  reference: string | null;
  reason: string | null;
  created_at: string;
};

/* ==========================================================================
   Promotions
   ========================================================================== */

export type Promotion = {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percent" | "fixed";
  discount_value: number;
  min_order_amount: number;
  /** Caps a percent promo in money terms. Null means uncapped. */
  max_discount_amount: number | null;
  starts_at: string | null;
  ends_at: string | null;
  /** Null means unlimited. */
  usage_limit: number | null;
  per_user_limit: number | null;
  is_active: boolean;
  created_at: string;
};

/**
 * The verdict from `evaluate_promo`. Returned rather than thrown so checkout
 * can SHOW why a code was refused; `create_order` raises on the same verdict.
 */
export type PromoVerdict = {
  valid: boolean;
  promotion_id: string | null;
  code: string | null;
  discount: number;
  message: string;
};

export type PromoPerformance = {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percent" | "fixed";
  discount_value: number;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  usage_limit: number | null;
  redemptions: number;
  discount_given: number;
  revenue_influenced: number;
};

/* ==========================================================================
   Customer preferences
   ========================================================================== */

/** A favourite, joined to its menu row by `my_favorites()`. */
export type FavoriteItem = {
  menu_item_id: string;
  name: string;
  description: string | null;
  flavor: string;
  category: string;
  price: number;
  image_url: string | null;
  is_available: boolean;
  favorited_at: string;
};

/** Prices are deliberately not stored — a preset is re-priced at today's menu. */
export type OrderPreset = {
  id: string;
  user_id: string;
  name: string;
  lines: { menu_item_id: string; quantity: number; size: "S" | "M" | "L" }[];
  created_at: string;
};

export type NotificationPreferences = {
  user_id: string;
  order_updates: boolean;
  ready_alerts: boolean;
  promotions: boolean;
  email_channel: boolean;
  sms_channel: boolean;
  updated_at: string;
};

/* ==========================================================================
   Settings
   ========================================================================== */

/** `day` is 0-6 with 0 = Sunday, matching JavaScript's Date#getDay(). */
export type BusinessHours = {
  day: number;
  label: string;
  open: string;
  close: string;
  closed: boolean;
};

export type ShopInfo = {
  name: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
};

export type OrderingSettings = {
  accepting_orders: boolean;
  default_prep_minutes: number;
  dine_in_enabled: boolean;
  takeout_enabled: boolean;
};

export type PaymentMethodSettings = Record<PaymentMethod, boolean>;

export type NotificationTemplates = {
  order_accepted: string;
  order_preparing: string;
  order_ready: string;
  order_completed: string;
};

/* ==========================================================================
   Analytics
   ========================================================================== */

export type BestSellingFlavor = {
  flavor: string;
  total_quantity: number;
  total_revenue: number;
  order_count: number;
};

export type SalesReportRow = {
  period: string;
  order_count: number;
  gross_amount: number;
  discount_amount: number;
  net_amount: number;
  average_order_value: number;
};

export type PeakHourRow = {
  hour_of_day: number;
  order_count: number;
  revenue: number;
};

export type PopularItemRow = {
  item_name: string;
  flavor: string;
  total_quantity: number;
  total_revenue: number;
  order_count: number;
};

export type CustomerSummary = {
  total_customers: number;
  new_customers: number;
  returning_customers: number;
  orders_per_customer: number;
  average_spend: number;
};

export type TopCustomerRow = {
  user_id: string;
  full_name: string | null;
  phone: string | null;
  order_count: number;
  total_spend: number;
  last_order_at: string;
};

export type WaitTimeStats = {
  sample_size: number;
  median_minutes: number;
  average_minutes: number;
  p90_minutes: number;
};

export type TodaySummary = {
  orders_today: number;
  revenue_today: number;
  pending_now: number;
  preparing_now: number;
  ready_now: number;
  unpaid_now: number;
};

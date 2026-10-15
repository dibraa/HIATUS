import type { OrderItem, OrderStatus } from "./database";

export type QueueOrder = {
  id: string;
  status: OrderStatus;
  order_type: "dine_in" | "takeout";
  table_label: string | null;
  priority: number;
  special_request_flag?: boolean;
  payment_method: "cash" | "ewallet";
  payment_status: "unpaid" | "paid" | "refunded" | "voided";
  total_amount: number;
  discount_amount: number;
  pickup_note: string | null;
  created_at: string;
  profiles: { full_name: string | null; phone: string | null } | null;
  order_items: OrderItem[];
};

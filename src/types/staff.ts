import type { OrderItem, OrderStatus } from "./database";

export type QueueOrder = {
  pickup_code?: string | null;
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
  subtotal_amount?: number;
  paid_at?: string | null;
  ready_at?: string | null;
  /** The order's payment log; a cash payment's reference holds the cash and change. */
  transactions?: { kind: "payment" | "refund" | "void"; reference: string | null }[];
  pickup_note: string | null;
  created_at: string;
  profiles: { full_name: string | null; phone: string | null } | null;
  order_items: OrderItem[];
};

export type ReportView = "sales" | "customers" | "transactions" | "refunds" | "reconciliation";
export type PeakHour = { hour: number; order_count: number };
export type LedgerEntry = {
  _id: string; order_id: string; order_code: string; created_at: string;
  kind: "payment" | "refund" | "void"; method: "cash" | "ewallet"; amount: number;
  reference: string | null; reason: string | null; source: string; conflict: boolean;
  customer_name: string; staff_name: string;
  order?: { _id: string; status: string; payment_status: string; total_amount: number };
  legacy_records: { _id: string; kind: string; amount: number; method: string; created_at: string; reason?: string }[];
};
export type LedgerReport = { items: LedgerEntry[]; total: number; page: number; page_size: number; totals: { payments: number; refunds: number; voids: number; net: number; conflicts: number } };
export type CustomerRow = { _id: string; full_name: string; order_count: number; total_spend: number; returning: boolean; first_order_at: string; last_order_at: string };
export type CustomerReport = { items: CustomerRow[]; total: number; page: number; page_size: number; hours: PeakHour[]; summary: { customers: number; new_customers: number; returning: number; repeat: number; average_spend: number; orders_per_customer: number } };
export type CustomerDetails = { customer: { _id: string; full_name: string }; orders: { _id: string; created_at: string; total_amount: number; items: { item_name: string; quantity: number }[] }[]; preferred: { _id: string; quantity: number }[]; total: number; page: number; page_size: number };
export type DisputeCase = {
  _id: string; issue: string; status: "open" | "in_review" | "resolved"; outcome: string | null; version: number; created_at: string; resolved_at: string | null;
  order_id: { _id: string; payment_status: string; total_amount: number; transactions: { kind: string; amount: number; reason: string; created_at: string }[] } | null;
  events: { _id: string; actor_name: string; kind: string; note: string; status: string; outcome: string | null; created_at: string }[];
  refunds: LedgerEntry[];
};
export type DisputeReport = { items: DisputeCase[]; total: number; page: number; page_size: number };
export const caseStatus = { open: "Open", in_review: "In review", resolved: "Resolved" };
export function financeLabel(value: string) { return value.replaceAll("_", " "); }

import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { FilterTabs } from "@/components/ui/filter-tabs";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { formatPrice } from "@/lib/format";
import { getSizeOption } from "@/lib/sizes";
import type { OrderItem, OrderStatus } from "@/types/database";
import { StatusSelect } from "./status-select";

export const metadata: Metadata = { title: "Orders" };

type OrderRow = {
  id: string;
  status: OrderStatus;
  total_amount: number;
  pickup_note: string | null;
  created_at: string;
  profiles: { full_name: string | null; phone: string | null } | null;
  order_items: OrderItem[];
};

const TABS = [
  { label: "Active", value: "active" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
  { label: "All", value: "all" },
];

/** Statuses the "Active" tab covers - anything the shop still owes a drink for. */
const ACTIVE_STATUSES: OrderStatus[] = ["pending", "preparing", "ready"];

const DATE_FORMAT = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = "active" } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("orders")
    .select("id, status, total_amount, pickup_note, created_at, profiles(full_name, phone), order_items(*)")
    .order("created_at", { ascending: false });

  if (tab === "active") query = query.in("status", ACTIVE_STATUSES);
  else if (tab === "completed") query = query.eq("status", "completed");
  else if (tab === "cancelled") query = query.eq("status", "cancelled");

  const { data: orders } = await query.returns<OrderRow[]>();
  const orderList = orders ?? [];

  return (
    <div>
      <PageHeader
        title="Orders"
        description="Move an order along with the status control on its card. The customer sees the change immediately."
      />

      <FilterTabs
        label="Filter orders by status"
        className="mb-6"
        tabs={TABS.map((t) => ({
          label: t.label,
          href: "/admin/orders?tab=" + t.value,
          active: tab === t.value,
        }))}
      />

      {orderList.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line-strong bg-card px-6 py-12 text-center text-sm text-muted">
          No orders in this view.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {orderList.map((order) => {
            const customer = order.profiles?.full_name ?? "Customer";
            const phone = order.profiles?.phone;

            return (
              <li key={order.id} className="rounded-lg border border-line bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-medium text-ink">{customer}</span>
                      {phone && (
                        <a
                          href={"tel:" + phone}
                          className="text-sm text-muted underline underline-offset-4 transition-colors duration-150 ease-hi hover:text-ink"
                        >
                          {phone}
                        </a>
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      <time dateTime={order.created_at}>
                        {DATE_FORMAT.format(new Date(order.created_at))}
                      </time>
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <OrderStatusBadge status={order.status} />
                    <StatusSelect orderId={order.id} status={order.status} customerName={customer} />
                  </div>
                </div>

                <ul className="mt-3 flex flex-col gap-1 border-t border-line pt-3 text-sm text-ink-soft">
                  {order.order_items.map((item) => (
                    <li key={item.id}>
                      <span className="tabular-nums text-muted">{item.quantity}&times;</span>{" "}
                      {item.item_name}
                      {item.size && (
                        <span className="text-muted"> &middot; {getSizeOption(item.size).label}</span>
                      )}
                    </li>
                  ))}
                </ul>

                {order.pickup_note && (
                  <p className="mt-3 rounded-md bg-raised px-3 py-2 text-sm text-ink-soft">
                    <span className="font-medium">Note:</span> &ldquo;{order.pickup_note}&rdquo;
                  </p>
                )}

                <p className="mt-3 text-sm font-semibold tabular-nums text-ink">
                  {formatPrice(order.total_amount)}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

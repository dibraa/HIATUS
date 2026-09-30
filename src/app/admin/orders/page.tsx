import type { Metadata } from "next";
import { getServerToken } from "@/lib/server-token";
import { apiJson } from "@/lib/api-client";
import { PageHeader } from "@/components/ui/page-header";
import { FilterTabs } from "@/components/ui/filter-tabs";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { DataError } from "@/components/ui/data-error";
import { formatPrice } from "@/lib/format";
import { getSizeOption } from "@/lib/sizes";
import { ADVANCE_LABELS, NEXT_STATUS } from "@/lib/order-meta";
import type { OrderItem, OrderStatus } from "@/types/database";
import { StatusSelect } from "./status-select";
import { AdvanceButton } from "./advance-button";

export const metadata: Metadata = { title: "Orders" };

type OrderRow = {
  _id: string; id?: string; status: OrderStatus; total_amount: number;
  pickup_note: string | null; created_at: string;
  user_id: { full_name: string | null; phone: string | null } | null;
  items: (OrderItem & { _id: string })[];
};

const TABS = [
  { label: "Active", value: "active" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
  { label: "All", value: "all" },
];

const ACTIVE_STATUSES: OrderStatus[] = ["pending", "preparing", "ready"];
const DATE_FORMAT = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" });

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab = "active" } = await searchParams;
  const token = await getServerToken();

  let allOrders: OrderRow[];
  try {
    allOrders = await apiJson<OrderRow[]>("/orders", { token: token ?? undefined });
  } catch {
    return (
      <div>
        <PageHeader
          title="Orders"
          description="Move an order along with the status control on its card. The customer sees the change immediately."
        />
        <DataError
          title="Couldn't load orders"
          body="Check your connection and try again."
        />
      </div>
    );
  }

  const filtered = allOrders.filter((o) => {
    if (tab === "active") return ACTIVE_STATUSES.includes(o.status);
    if (tab === "completed") return o.status === "completed";
    if (tab === "cancelled") return o.status === "cancelled";
    return true;
  });

  const orderList = filtered.map((o) => ({ ...o, id: o._id ?? o.id, items: o.items.map((i) => ({ ...i, id: i._id ?? i.id })) }));

  return (
    <div>
      <PageHeader
        title="Orders"
        description="Move an order along with the status control on its card. The customer sees the change immediately."
      />

      <FilterTabs
        label="Filter orders by status"
        className="mb-6"
        tabs={TABS.map((t) => ({ label: t.label, href: "/admin/orders?tab=" + t.value, active: tab === t.value }))}
      />

      {orderList.length === 0 ? (
        <EmptyState
          title="No orders in this view"
          body={tab === "active" ? "Orders placed through the storefront appear here as they come in." : "No orders match this filter yet."}
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {orderList.map((order) => {
            const customer = (order.user_id as { full_name: string | null } | null)?.full_name ?? "Customer";
            const phone = (order.user_id as { phone: string | null } | null)?.phone;
            return (
              <li key={order.id} className="rounded-lg border border-line bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="font-medium text-ink">{customer}</span>
                      {phone && <a href={"tel:" + phone} className="text-sm text-muted underline underline-offset-4 transition-colors hover:text-ink">{phone}</a>}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      <time dateTime={order.created_at}>{DATE_FORMAT.format(new Date(order.created_at))}</time>
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <OrderStatusBadge status={order.status} />
                    {NEXT_STATUS[order.status] && ADVANCE_LABELS[order.status] && (
                      <AdvanceButton orderId={order.id!} status={order.status} />
                    )}
                    <StatusSelect orderId={order.id!} status={order.status} customerName={customer} />
                  </div>
                </div>

                <ul className="mt-3 flex flex-col gap-1 border-t border-line pt-3 text-sm text-ink-soft">
                  {order.items.map((item) => (
                    <li key={item.id}>
                      <span className="numeric text-muted">{item.quantity}&times;</span>{" "}
                      {item.item_name}
                      {item.size && <span className="text-muted"> &middot; {getSizeOption(item.size).label}</span>}
                    </li>
                  ))}
                </ul>

                {order.pickup_note && (
                  <p className="mt-3 rounded-md bg-raised px-3 py-2 text-sm text-ink-soft">
                    <span className="font-medium">Note:</span> &ldquo;{order.pickup_note}&rdquo;
                  </p>
                )}
                <p className="mt-3 text-sm font-semibold numeric text-ink">{formatPrice(order.total_amount)}</p>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

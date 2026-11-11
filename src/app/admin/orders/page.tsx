import type { Metadata } from "next";
import { AutoRefresh } from "@/components/auto-refresh";
import { getServerToken } from "@/lib/server-token";
import { apiJson } from "@/lib/api-client";
import { AdminPageHeader as PageHeader } from "@/components/admin-page-header";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { DataError } from "@/components/ui/data-error";
import { formatDateTime, formatElapsed, formatPrice, orderCode } from "@/lib/format";
import { servingLabel } from "@/lib/sizes";
import { ORDER_TYPE_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/order-meta";
import type { OrderItem, OrderStatus, OrderType, PaymentStatus } from "@/types/database";
import { OrderStatusFilter } from "./order-status-filter";
import { AdminPagination } from "@/components/admin-pagination";

export const metadata: Metadata = { title: "Orders" };
export const dynamic = "force-dynamic";

type OrderRow = {
  pickup_code?: string | null;
  _id: string; id?: string; status: OrderStatus; order_type: OrderType;
  payment_status: PaymentStatus; total_amount: number;
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

function itemSummary(item: OrderItem) {
  const size = item.size ? ` · ${servingLabel(item, item.size)}` : "";
  return `${item.quantity}× ${item.item_name}${size}`;
}

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ tab?: string; page?: string }> }) {
  const { tab = "active", page: requestedPage } = await searchParams;
  const token = await getServerToken();

  let allOrders: OrderRow[];
  try {
    allOrders = await apiJson<OrderRow[]>("/orders", { token: token ?? undefined, cache: "no-store" });
  } catch {
    return (
      <div>
        <PageHeader
          title="Orders"

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

  const orderList = filtered
    .map((o) => ({ ...o, id: o._id ?? o.id, items: (o.items ?? []).map((i) => ({ ...i, id: i._id ?? i.id })) }))
    .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at) || String(b.id).localeCompare(String(a.id)));

  const pageSize = 7;
  const pageCount = Math.max(1, Math.ceil(orderList.length / pageSize));
  const parsedPage = Number(requestedPage);
  const page = Math.min(pageCount, Number.isSafeInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1);
  const visibleOrders = orderList.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div>
      <PageHeader
        title="Orders"

      />

      <AutoRefresh seconds={15} />
      <p className="mb-4 text-sm text-muted">Updates every 15 seconds.</p>
      <OrderStatusFilter currentTab={tab} tabs={TABS} />

      {orderList.length === 0 ? (
        <EmptyState
          title="No orders in this view"
        />
      ) : (
        <section className="admin-panel">
          <div className="admin-table-scroll" tabIndex={0} role="region" aria-label="Orders table">
            <table className="admin-recent-table admin-orders-table w-full text-left text-sm">
              <thead className="border-b border-line text-xs text-muted">
                <tr>
                  <th scope="col" className="px-2 py-3 font-medium">#</th>
                  <th scope="col" className="px-2 py-3 font-medium">Customer</th>
                  <th scope="col" className="px-2 py-3 font-medium">Time</th>
                  <th scope="col" className="px-2 py-3 font-medium">Items</th>
                  <th scope="col" className="px-2 py-3 font-medium">Type</th>
                  <th scope="col" className="px-2 py-3 font-medium">Price</th>
                  <th scope="col" className="px-2 py-3 font-medium">Payment</th>
                  <th scope="col" className="px-2 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visibleOrders.map((order) => {
                  const customer = order.user_id?.full_name?.trim() || orderCode(order.id!, order.pickup_code);
                  const phone = order.user_id?.phone;
                  const fullItems = order.items.map(itemSummary).join(", ");
                  const visibleItems = order.items.slice(0, 2);
                  const hiddenCount = order.items.length - visibleItems.length;
                  return (
                    <tr key={order.id} className="text-ink-soft">
                      <td className="whitespace-nowrap px-2 py-4 text-xs text-muted">{orderCode(order.id!, order.pickup_code)}{!order.pickup_code && <span className="block max-w-48 break-all whitespace-normal text-xs">ID: {order.id}</span>}</td>
                      <th scope="row" className="min-w-28 px-2 py-4 font-medium text-ink">
                        {customer}
                        {phone && (
                          <a
                            href={"tel:" + phone}
                            className="mt-0.5 block text-xs font-normal text-muted underline underline-offset-4 transition-colors hover:text-ink"
                          >
                            {phone}
                          </a>
                        )}
                      </th>
                      <td className="whitespace-nowrap px-2 py-4 text-xs text-muted">
                        <time dateTime={order.created_at} title={formatDateTime(order.created_at)}>
                          {formatElapsed(order.created_at)}
                        </time>
                      </td>
                      <td className="max-w-56 px-2 py-4 text-xs" title={fullItems}>
                        {visibleItems.map((item) => (
                          <p key={item.id} className="truncate">
                            <span className="numeric text-muted">{item.quantity}&times;</span> {item.item_name}
                            {item.size && <span className="text-muted"> · {servingLabel(item, item.size)}</span>}
                          </p>
                        ))}
                        {hiddenCount > 0 && <p className="mt-0.5 text-muted">+{hiddenCount} more</p>}
                        {order.pickup_note && <p className="mt-0.5 truncate text-muted">Note: &ldquo;{order.pickup_note}&rdquo;</p>}
                      </td>
                      <td className="whitespace-nowrap px-2 py-4 text-xs">{ORDER_TYPE_LABELS[order.order_type] ?? order.order_type}</td>
                      <td className="whitespace-nowrap px-2 py-4 font-semibold tabular-nums text-ink">{formatPrice(order.total_amount)}</td>
                      <td className="whitespace-nowrap px-2 py-4 text-xs">{PAYMENT_STATUS_LABELS[order.payment_status] ?? order.payment_status}{order.status === "cancelled" && order.payment_status === "paid" && <strong className="mt-1 block text-warning-soft-fg">Refund required</strong>}</td>
                      <td className="px-2 py-4">
                        <div className="flex flex-wrap gap-1">
                          {order.payment_status === "unpaid" && order.status !== "cancelled" && <Badge tone="warning">{PAYMENT_STATUS_LABELS.unpaid}</Badge>}
                          <OrderStatusBadge status={order.status} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
      <AdminPagination path="/admin/orders" query={new URLSearchParams({ tab })} page={page} pageSize={pageSize} total={orderList.length} />
    </div>
  );
}

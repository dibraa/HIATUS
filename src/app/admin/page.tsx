import type { Metadata } from "next";
import Link from "next/link";
import { getServerToken } from "@/lib/server-token";
import { apiJson } from "@/lib/api-client";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { formatPrice, formatTime, orderCode } from "@/lib/format";
import { ORDER_TYPE_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/order-meta";
import type { OrderStatus, PaymentStatus, PopularItemRow, SalesReportRow, TodaySummary } from "@/types/database";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

type RecentOrder = {
  _id: string; id?: string; status: OrderStatus; order_type: "dine_in" | "takeout";
  payment_status: PaymentStatus; total_amount: number; created_at: string;
  user_id: { full_name: string | null } | null;
};

function SalesTrend({ data }: { data: SalesReportRow[] }) {
  if (data.length === 0) return <div className="flex h-56 items-center justify-center text-sm text-muted">No completed sales in the last 7 days yet.</div>;
  const values = data.map((r) => r.net_amount);
  const maximum = Math.max(...values, 1);
  const points = values.map((v, i) => {
    const x = data.length === 1 ? 50 : (i / (data.length - 1)) * 100;
    const y = 92 - (v / maximum) * 70;
    return `${x},${y}`;
  });
  const line = points.join(" ");
  const area = `0,100 ${line} 100,100`;
  return (
    <div className="relative h-56" aria-hidden="true">
      <div className="absolute inset-x-0 top-5 space-y-9">{[0,1,2,3].map((r) => <div key={r} className="border-t border-dashed border-line" />)}</div>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="relative h-full w-full overflow-visible">
        <polygon points={area} fill="var(--hi-accent-soft)" fillOpacity="0.72" />
        <polyline points={line} fill="none" stroke="var(--hi-accent)" strokeWidth="1.1" vectorEffect="non-scaling-stroke" />
        {points.map((p, i) => { const [x, y] = p.split(","); return <circle key={i} cx={x} cy={y} r="1.3" fill="var(--hi-accent)" vectorEffect="non-scaling-stroke" />; })}
      </svg>
      <div className="absolute inset-x-0 bottom-0 flex justify-between text-[11px] text-muted"><span>7 days ago</span><span>Today</span></div>
    </div>
  );
}

export default async function AdminDashboardPage() {
  const token = await getServerToken();

  const [summary, salesRaw, popularRaw, recentRaw] = await Promise.all([
    apiJson<TodaySummary>("/analytics/today", { token: token ?? undefined }).catch(() => null),
    apiJson<SalesReportRow[]>("/analytics/sales?days=7", { token: token ?? undefined }).catch(() => []),
    apiJson<PopularItemRow[]>("/analytics/popular-items", { token: token ?? undefined }).catch(() => []),
    apiJson<RecentOrder[]>("/orders", { token: token ?? undefined }).catch(() => []),
  ]);

  const recentOrders = recentRaw.slice(0, 8).map((o) => ({ ...o, id: o._id ?? o.id }));
  const topItems = popularRaw.slice(0, 5);
  const openNow = (summary?.pending_now ?? 0) + (summary?.preparing_now ?? 0) + (summary?.ready_now ?? 0);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Welcome to Hiatus</h1>
          <p className="mt-1 text-sm text-muted">Choose the category</p>
        </div>
        <Link href="/staff" className="inline-flex min-h-10 items-center rounded-full bg-accent px-5 text-sm font-semibold text-accent-fg transition-colors hover:bg-accent-hover">
          Open the queue
        </Link>
      </header>

      <section aria-labelledby="today-heading">
        <h2 id="today-heading" className="sr-only">Today at a glance</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard label="Total sales" value={formatPrice(summary?.revenue_today ?? 0)} hint={`${summary?.orders_today ?? 0} completed orders`} tone="positive" />
          <StatCard label="Total orders" value={summary?.orders_today ?? 0} hint={`${openNow} currently open`} />
          <StatCard label="Awaiting payment" value={summary?.unpaid_now ?? 0} tone={(summary?.unpaid_now ?? 0) > 0 ? "attention" : "default"} hint="Across all open orders" />
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.8fr)]">
        <section aria-labelledby="analytics-heading" className="rounded-2xl border border-line bg-card p-5 sm:p-6">
          <div className="mb-6 flex items-baseline justify-between gap-4">
            <h2 id="analytics-heading" className="text-lg font-semibold text-ink">Sales analytics</h2>
            <Link href="/admin/reports" className="text-xs font-medium text-accent-ink hover:text-ink">See all</Link>
          </div>
          <SalesTrend data={salesRaw} />
        </section>

        <section aria-labelledby="top-items-heading" className="rounded-2xl border border-line bg-card p-5 sm:p-6">
          <div className="mb-5 flex items-baseline justify-between gap-4">
            <h2 id="top-items-heading" className="text-lg font-semibold text-ink">Trending coffee</h2>
            <Link href="/admin/reports" className="text-xs font-medium text-accent-ink hover:text-ink">See all</Link>
          </div>
          {topItems.length === 0 ? (
            <EmptyState as="h3" title="Nothing sold yet" body="Popular drinks appear here after orders complete." />
          ) : (
            <ol className="divide-y divide-line">
              {topItems.map((item, i) => (
                <li key={`${item.item_name}-${item.flavor}`} className="flex items-center gap-3 py-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-sm font-semibold text-accent-ink">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{item.item_name}</p>
                    <p className="truncate text-xs text-muted">{item.flavor || "Classic"}</p>
                  </div>
                  <p className="text-sm font-semibold tabular-nums text-ink">{item.total_quantity}</p>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <section aria-labelledby="recent-heading" className="rounded-2xl border border-line bg-card p-5 sm:p-6">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 id="recent-heading" className="text-lg font-semibold text-ink">Recent orders</h2>
          <Link href="/admin/orders" className="text-xs font-medium text-accent-ink hover:text-ink">See all</Link>
        </div>
        {recentOrders.length === 0 ? (
          <EmptyState as="h3" title="No orders yet" body="Orders placed through the storefront appear here as they come in." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[42rem] text-left text-sm">
              <thead className="border-b border-line text-xs text-muted">
                <tr>
                  <th scope="col" className="px-2 py-3 font-medium">#</th>
                  <th scope="col" className="px-2 py-3 font-medium">Customer</th>
                  <th scope="col" className="px-2 py-3 font-medium">Time</th>
                  <th scope="col" className="px-2 py-3 font-medium">Type</th>
                  <th scope="col" className="px-2 py-3 font-medium">Price</th>
                  <th scope="col" className="px-2 py-3 font-medium">Payment</th>
                  <th scope="col" className="px-2 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {recentOrders.map((order, i) => (
                  <tr key={order.id} className="text-ink-soft">
                    <td className="px-2 py-4 text-xs text-muted">{String(i + 1).padStart(2, "0")}</td>
                    <th scope="row" className="px-2 py-4 font-medium text-ink">
                      {(order.user_id as { full_name: string | null } | null)?.full_name?.trim() || orderCode(order.id!)}
                    </th>
                    <td className="whitespace-nowrap px-2 py-4 text-xs text-muted">
                      <time dateTime={order.created_at}>{formatTime(order.created_at)}</time>
                    </td>
                    <td className="px-2 py-4 text-xs">{ORDER_TYPE_LABELS[order.order_type]}</td>
                    <td className="px-2 py-4 font-semibold tabular-nums text-ink">{formatPrice(order.total_amount)}</td>
                    <td className="px-2 py-4 text-xs">{PAYMENT_STATUS_LABELS[order.payment_status]}</td>
                    <td className="px-2 py-4">
                      <div className="flex flex-wrap gap-1">
                        {order.payment_status === "unpaid" && order.status !== "cancelled" && <Badge tone="warning">{PAYMENT_STATUS_LABELS.unpaid}</Badge>}
                        <OrderStatusBadge status={order.status} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

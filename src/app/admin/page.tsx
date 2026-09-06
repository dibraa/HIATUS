import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { formatPrice, formatTime, orderCode } from "@/lib/format";
import { ORDER_TYPE_LABELS, PAYMENT_STATUS_LABELS, formatWait } from "@/lib/order-meta";
import type {
  OrderStatus,
  PaymentStatus,
  PopularItemRow,
  SalesReportRow,
  TodaySummary,
  WaitTimeStats,
} from "@/types/database";

export const metadata: Metadata = { title: "Dashboard" };

export const dynamic = "force-dynamic";

type RecentOrder = {
  id: string;
  status: OrderStatus;
  order_type: "dine_in" | "takeout";
  payment_status: PaymentStatus;
  total_amount: number;
  created_at: string;
  profiles: { full_name: string | null } | null;
};

function isoDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

function SalesTrend({ data }: { data: SalesReportRow[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-muted">
        No completed sales in the last 7 days yet.
      </div>
    );
  }

  const values = data.map((row) => row.net_amount);
  const maximum = Math.max(...values, 1);
  const points = values.map((value, index) => {
    const x = data.length === 1 ? 50 : (index / (data.length - 1)) * 100;
    const y = 92 - (value / maximum) * 70;
    return `${x},${y}`;
  });
  const line = points.join(" ");
  const area = `0,100 ${line} 100,100`;

  return (
    <div className="relative h-56" aria-hidden="true">
      <div className="absolute inset-x-0 top-5 space-y-9">
        {[0, 1, 2, 3].map((row) => (
          <div key={row} className="border-t border-dashed border-line" />
        ))}
      </div>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="relative h-full w-full overflow-visible">
        <polygon points={area} fill="var(--hi-accent-soft)" fillOpacity="0.72" />
        <polyline points={line} fill="none" stroke="var(--hi-accent)" strokeWidth="1.1" vectorEffect="non-scaling-stroke" />
        {points.map((point, index) => {
          const [x, y] = point.split(",");
          return <circle key={index} cx={x} cy={y} r="1.3" fill="var(--hi-accent)" vectorEffect="non-scaling-stroke" />;
        })}
      </svg>
      <div className="absolute inset-x-0 bottom-0 flex justify-between text-[11px] text-muted">
        <span>7 days ago</span>
        <span>Today</span>
      </div>
    </div>
  );
}

/**
 * The screen the owner opens first.
 *
 * Answers four questions in the order they are actually asked: is anything on
 * fire right now, what did we take today, what is selling, and what just
 * happened. Anything that needs a date range or a chart belongs in Reports —
 * a dashboard that makes you choose a filter before it tells you anything has
 * failed at being a dashboard.
 */
export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [
    { data: summaryRows },
    { data: waitRows },
    { data: popular },
    { data: sales },
    { data: recent },
  ] = await Promise.all([
    supabase.rpc("today_summary", { tz: "Asia/Manila" }),
    supabase.rpc("wait_time_stats", { days_back: 7 }),
    supabase.rpc("popular_items", { days_back: 30, limit_count: 5 }),
    supabase.rpc("sales_report", {
      from_date: isoDaysAgo(7),
      to_date: null,
      bucket: "day",
      tz: "Asia/Manila",
    }),
    supabase
      .from("orders")
      .select("id, status, order_type, payment_status, total_amount, created_at, profiles(full_name)")
      .order("created_at", { ascending: false })
      .limit(8)
      .returns<RecentOrder[]>(),
  ]);

  const summary = (summaryRows as TodaySummary[] | null)?.[0] ?? null;
  const waits = (waitRows as WaitTimeStats[] | null)?.[0] ?? null;
  const topItems = (popular as PopularItemRow[] | null) ?? [];
  const salesRows = (sales as SalesReportRow[] | null) ?? [];
  const recentOrders = recent ?? [];

  const openNow =
    (summary?.pending_now ?? 0) +
    (summary?.preparing_now ?? 0) +
    (summary?.ready_now ?? 0);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Welcome to Hiatus
          </h1>
          <p className="mt-1 text-sm text-muted">Choose the category</p>
        </div>
        <Link
          href="/staff"
          className="inline-flex min-h-10 items-center rounded-full bg-accent px-5 text-sm font-semibold text-accent-fg transition-colors hover:bg-accent-hover"
        >
          Open the queue
        </Link>
      </header>

      <section aria-labelledby="today-heading">
        <h2 id="today-heading" className="sr-only">Today at a glance</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <StatCard
            label="Total sales"
            value={formatPrice(summary?.revenue_today ?? 0)}
            hint={`${summary?.orders_today ?? 0} completed ${
              (summary?.orders_today ?? 0) === 1 ? "order" : "orders"
            }`}
            tone="positive"
          />
          <StatCard
            label="Total orders"
            value={summary?.orders_today ?? 0}
            hint={`${openNow} currently open`}
          />
          <StatCard
            label="Awaiting payment"
            value={summary?.unpaid_now ?? 0}
            tone={(summary?.unpaid_now ?? 0) > 0 ? "attention" : "default"}
            hint="Across all open orders"
          />
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.8fr)]">
        <section aria-labelledby="analytics-heading" className="rounded-2xl border border-line bg-card p-5 sm:p-6">
          <div className="mb-6 flex items-baseline justify-between gap-4">
            <h2 id="analytics-heading" className="text-lg font-semibold text-ink">Sales analytics</h2>
            <Link
              href="/admin/reports"
              className="text-xs font-medium text-accent-ink hover:text-ink"
            >
              See all
            </Link>
          </div>
          <SalesTrend data={salesRows} />
        </section>

        <section aria-labelledby="top-items-heading" className="rounded-2xl border border-line bg-card p-5 sm:p-6">
          <div className="mb-5 flex items-baseline justify-between gap-4">
            <h2 id="top-items-heading" className="text-lg font-semibold text-ink">Trending coffee</h2>
            <Link
              href="/admin/reports"
              className="text-xs font-medium text-accent-ink hover:text-ink"
            >
              See all
            </Link>
          </div>
          {topItems.length === 0 ? (
            <EmptyState
              as="h3"
              title="Nothing sold yet"
              body="Popular drinks appear here after orders complete."
            />
          ) : (
            <ol className="divide-y divide-line">
              {topItems.map((item, index) => (
                <li key={`${item.item_name}-${item.flavor}`} className="flex items-center gap-3 py-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-sm font-semibold text-accent-ink">{index + 1}</span>
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
          <h2 id="recent-heading" className="text-lg font-semibold text-ink">Recent order</h2>
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
                  <th scope="col" className="px-2 py-3 font-medium">Items</th>
                  <th scope="col" className="px-2 py-3 font-medium">Date &amp; time</th>
                  <th scope="col" className="px-2 py-3 font-medium">Order type</th>
                  <th scope="col" className="px-2 py-3 font-medium">Price</th>
                  <th scope="col" className="px-2 py-3 font-medium">Payment</th>
                  <th scope="col" className="px-2 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {recentOrders.map((order, index) => (
                  <tr key={order.id} className="text-ink-soft">
                    <td className="px-2 py-4 text-xs text-muted">{String(index + 1).padStart(2, "0")}</td>
                    <th scope="row" className="px-2 py-4 font-medium text-ink">{order.profiles?.full_name?.trim() || orderCode(order.id)}</th>
                    <td className="whitespace-nowrap px-2 py-4 text-xs text-muted"><time dateTime={order.created_at}>{formatTime(order.created_at)}</time></td>
                    <td className="px-2 py-4 text-xs">{ORDER_TYPE_LABELS[order.order_type]}</td>
                    <td className="px-2 py-4 font-semibold tabular-nums text-ink">{formatPrice(order.total_amount)}</td>
                    <td className="px-2 py-4 text-xs">{PAYMENT_STATUS_LABELS[order.payment_status]}</td>
                    <td className="px-2 py-4"><div className="flex flex-wrap gap-1">{order.payment_status === "unpaid" && order.status !== "cancelled" && <Badge tone="warning">{PAYMENT_STATUS_LABELS.unpaid}</Badge>}<OrderStatusBadge status={order.status} /></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {waits && waits.sample_size > 0 && <p className="text-sm text-muted">Typical wait: <span className="font-semibold text-ink-soft">{formatWait(waits.median_minutes)}</span> median, <span className="font-semibold text-ink-soft">{formatWait(waits.p90_minutes)}</span> for 90% of orders.</p>}
    </div>
  );
}

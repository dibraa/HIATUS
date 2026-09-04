import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { formatPrice, formatTime, orderCode } from "@/lib/format";
import { ORDER_TYPE_LABELS, PAYMENT_STATUS_LABELS, formatWait } from "@/lib/order-meta";
import type {
  OrderStatus,
  PaymentStatus,
  PopularItemRow,
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
    { data: recent },
  ] = await Promise.all([
    supabase.rpc("today_summary", { tz: "Asia/Manila" }),
    supabase.rpc("wait_time_stats", { days_back: 7 }),
    supabase.rpc("popular_items", { days_back: 30, limit_count: 5 }),
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
  const recentOrders = recent ?? [];

  const openNow =
    (summary?.pending_now ?? 0) +
    (summary?.preparing_now ?? 0) +
    (summary?.ready_now ?? 0);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Today at a glance. Date ranges, charts and exports live under Reports."
        action={
          <ButtonLink href="/staff" variant="secondary" size="md">
            Open the queue
          </ButtonLink>
        }
      />

      {/* ---------- Today ---------- */}
      <section aria-labelledby="today-heading">
        <h2 id="today-heading" className="sr-only">
          Today at a glance
        </h2>

        <StatGrid>
          <StatCard
            label="Revenue today"
            value={formatPrice(summary?.revenue_today ?? 0)}
            hint={`${summary?.orders_today ?? 0} completed ${
              (summary?.orders_today ?? 0) === 1 ? "order" : "orders"
            }`}
            tone="positive"
          />
          <StatCard
            label="Open orders"
            value={openNow}
            tone={openNow > 0 ? "attention" : "default"}
            hint={`${summary?.pending_now ?? 0} new · ${summary?.ready_now ?? 0} ready`}
          />
          <StatCard
            label="Awaiting payment"
            value={summary?.unpaid_now ?? 0}
            tone={(summary?.unpaid_now ?? 0) > 0 ? "attention" : "default"}
            hint="Across all open orders"
          />
          <StatCard
            label="Typical wait"
            value={
              waits && waits.sample_size > 0 ? `${waits.median_minutes}m` : "—"
            }
            hint={
              waits && waits.sample_size > 0
                ? `Median of ${waits.sample_size} in 7 days`
                : "Not enough data yet"
            }
          />
        </StatGrid>
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        {/* ---------- What is selling ---------- */}
        <section aria-labelledby="top-items-heading">
          <div className="mb-3 flex items-baseline justify-between gap-4">
            <h2
              id="top-items-heading"
              className="text-2xs font-semibold uppercase tracking-[0.16em] text-muted"
            >
              Top sellers · 30 days
            </h2>
            <Link
              href="/admin/reports"
              className="text-xs font-medium text-accent-ink underline underline-offset-4 transition-colors duration-150 ease-hi hover:text-ink"
            >
              Full report
            </Link>
          </div>

          {topItems.length === 0 ? (
            <EmptyState
              as="h3"
              title="Nothing sold yet"
              body="Once orders start completing, the drinks people buy most show up here."
            />
          ) : (
            <ol className="divide-y divide-line rounded-lg border border-line bg-card">
              {topItems.map((item, i) => (
                <li
                  key={`${item.item_name}-${item.flavor}`}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  {/* The rank is decorative — the list is already ordered, and
                      an <ol> announces position on its own. */}
                  <span
                    aria-hidden="true"
                    className="w-5 shrink-0 text-sm font-semibold tabular-nums text-muted"
                  >
                    {i + 1}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">
                      {item.item_name}
                    </p>
                    <p className="text-xs text-muted">{item.flavor}</p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold tabular-nums text-ink">
                      {item.total_quantity}
                    </p>
                    <p className="text-xs tabular-nums text-muted">
                      {formatPrice(item.total_revenue)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* ---------- What just happened ---------- */}
        <section aria-labelledby="recent-heading">
          <div className="mb-3 flex items-baseline justify-between gap-4">
            <h2
              id="recent-heading"
              className="text-2xs font-semibold uppercase tracking-[0.16em] text-muted"
            >
              Latest orders
            </h2>
            <Link
              href="/admin/orders"
              className="text-xs font-medium text-accent-ink underline underline-offset-4 transition-colors duration-150 ease-hi hover:text-ink"
            >
              All orders
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <EmptyState
              as="h3"
              title="No orders yet"
              body="Orders placed through the storefront appear here as they come in."
            />
          ) : (
            <ul className="divide-y divide-line rounded-lg border border-line bg-card">
              {recentOrders.map((order) => (
                <li key={order.id} className="px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-ink">
                          {orderCode(order.id)}
                        </span>
                        <span className="truncate text-sm text-ink-soft">
                          {order.profiles?.full_name?.trim() || "Walk-in"}
                        </span>
                      </p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted">
                        <time dateTime={order.created_at}>
                          {formatTime(order.created_at)}
                        </time>
                        <span aria-hidden="true">&middot;</span>
                        <span>{ORDER_TYPE_LABELS[order.order_type]}</span>
                        <span aria-hidden="true">&middot;</span>
                        <span className="tabular-nums">
                          {formatPrice(order.total_amount)}
                        </span>
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                      {order.payment_status === "unpaid" &&
                        order.status !== "cancelled" && (
                          <Badge tone="warning">
                            {PAYMENT_STATUS_LABELS.unpaid}
                          </Badge>
                        )}
                      <OrderStatusBadge status={order.status} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {waits && waits.sample_size > 0 && (
        <p className="mt-8 rounded-lg border border-line bg-raised px-4 py-3 text-sm text-ink-soft">
          Over the last 7 days, half of all orders were ready in{" "}
          <span className="font-semibold">{formatWait(waits.median_minutes)}</span>,
          and 9 in 10 within{" "}
          <span className="font-semibold">{formatWait(waits.p90_minutes)}</span>.
        </p>
      )}
    </div>
  );
}

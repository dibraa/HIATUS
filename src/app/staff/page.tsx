import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { FilterTabs } from "@/components/ui/filter-tabs";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { FormError } from "@/components/ui/field";
import { formatPrice } from "@/lib/format";
import { ACTIVE_STATUSES } from "@/lib/order-meta";
import type { OrderStatus, TodaySummary } from "@/types/database";
import { OrderTicket, type QueueOrder } from "./order-ticket";
import { AutoRefresh } from "@/components/auto-refresh";

export const metadata: Metadata = { title: "Order queue" };

// The queue is the definition of live data — a cached render of it is a wrong
// render. This opts the route out of Next's full route cache entirely.
export const dynamic = "force-dynamic";

const TABS: { label: string; value: string; statuses: OrderStatus[] }[] = [
  { label: "All active", value: "active", statuses: ACTIVE_STATUSES },
  { label: "New", value: "pending", statuses: ["pending"] },
  { label: "Making", value: "preparing", statuses: ["preparing"] },
  { label: "Ready", value: "ready", statuses: ["ready"] },
];

export default async function StaffQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = "active" } = await searchParams;
  const active = TABS.find((t) => t.value === tab) ?? TABS[0];

  const supabase = await createClient();

  const [{ data: summaryRows }, { data: orders, error }] = await Promise.all([
    supabase.rpc("today_summary", { tz: "Asia/Manila" }),
    supabase
      .from("orders")
      .select(
        "id, status, order_type, table_label, priority, payment_method, payment_status, " +
          "total_amount, discount_amount, promo_code, pickup_note, created_at, " +
          "profiles(full_name, phone), order_items(*)"
      )
      .in("status", active.statuses)
      // Bumped tickets first, then plain first-come-first-served. An unbumped
      // queue is exactly the order the drinks were ordered in.
      .order("priority", { ascending: false })
      .order("created_at", { ascending: true })
      .returns<QueueOrder[]>(),
  ]);

  // The RPC returns a single-row table, which PostgREST hands back as an array.
  const summary = (summaryRows as TodaySummary[] | null)?.[0] ?? null;
  const queue = orders ?? [];

  return (
    <div>
      <AutoRefresh seconds={15} />

      <PageHeader
        title="Order queue"
        description="Newest at the bottom, longest wait at the top. Tap the button on a ticket to move it along."
      />

      {summary && (
        <div className="mb-6">
          <StatGrid>
            <StatCard
              label="New"
              value={summary.pending_now}
              tone={summary.pending_now > 0 ? "attention" : "default"}
              hint="Not started yet"
            />
            <StatCard label="Making" value={summary.preparing_now} hint="In progress" />
            <StatCard
              label="Ready"
              value={summary.ready_now}
              tone={summary.ready_now > 0 ? "positive" : "default"}
              hint="On the counter"
            />
            <StatCard
              label="Today"
              value={formatPrice(summary.revenue_today)}
              hint={`${summary.orders_today} completed`}
            />
          </StatGrid>
        </div>
      )}

      <FilterTabs
        label="Filter the queue by status"
        className="mb-6"
        tabs={TABS.map((t) => ({
          label: t.label,
          href: `/staff?tab=${t.value}`,
          active: t.value === active.value,
        }))}
      />

      {error ? (
        <FormError>{error.message}</FormError>
      ) : queue.length === 0 ? (
        <EmptyState
          title={active.value === "active" ? "Nothing in the queue" : "Nothing here"}
          body={
            active.value === "active"
              ? "Every order has been handed over. New ones appear here on their own."
              : "No orders are at this stage right now."
          }
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {queue.map((order) => (
            <li key={order.id}>
              <OrderTicket order={order} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

import type { Metadata } from "next";
import { getServerToken } from "@/lib/supabase/server";
import { apiJson } from "@/lib/api-client";
import { PageHeader } from "@/components/ui/page-header";
import { FilterTabs } from "@/components/ui/filter-tabs";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatPrice } from "@/lib/format";
import { ACTIVE_STATUSES } from "@/lib/order-meta";
import type { OrderStatus, TodaySummary } from "@/types/database";
import { OrderTicket, type QueueOrder } from "./order-ticket";
import { AutoRefresh } from "@/components/auto-refresh";

export const metadata: Metadata = { title: "Order queue" };
export const dynamic = "force-dynamic";

const TABS: { label: string; value: string; statuses: OrderStatus[] }[] = [
  { label: "All active", value: "active", statuses: ACTIVE_STATUSES },
  { label: "New", value: "pending", statuses: ["pending"] },
  { label: "Making", value: "preparing", statuses: ["preparing"] },
  { label: "Ready", value: "ready", statuses: ["ready"] },
];

export default async function StaffQueuePage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab = "active" } = await searchParams;
  const active = TABS.find((t) => t.value === tab) ?? TABS[0];
  const token = await getServerToken();

  const [summary, allOrders] = await Promise.all([
    apiJson<TodaySummary>("/analytics/today", { token: token ?? undefined }).catch(() => null),
    apiJson<(QueueOrder & { _id: string })[]>("/orders", { token: token ?? undefined }).catch(() => []),
  ]);

  const queue = allOrders
    .filter((o) => active.statuses.includes(o.status))
    .map((o) => ({
      ...o,
      id: o._id ?? o.id,
      order_items: ((o as unknown as { items: unknown[] }).items ?? []) as import("@/types/database").OrderItem[],
      profiles: (o as unknown as { user_id: unknown }).user_id as { full_name: string | null; phone: string | null } | null,
    }))
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0) || new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  return (
    <div>
      <AutoRefresh seconds={15} />
      <PageHeader title="Order queue" description="Newest at the bottom, longest wait at the top." />

      {summary && (
        <div className="mb-6">
          <StatGrid>
            <StatCard label="New" value={summary.pending_now} tone={summary.pending_now > 0 ? "attention" : "default"} hint="Not started yet" />
            <StatCard label="Making" value={summary.preparing_now} hint="In progress" />
            <StatCard label="Ready" value={summary.ready_now} tone={summary.ready_now > 0 ? "positive" : "default"} hint="On the counter" />
            <StatCard label="Today" value={formatPrice(summary.revenue_today)} hint={`${summary.orders_today} completed`} />
          </StatGrid>
        </div>
      )}

      <FilterTabs
        label="Filter the queue by status"
        className="mb-6"
        tabs={TABS.map((t) => ({ label: t.label, href: `/staff?tab=${t.value}`, active: t.value === active.value }))}
      />

      {queue.length === 0 ? (
        <EmptyState
          title={active.value === "active" ? "Nothing in the queue" : "Nothing here"}
          body={active.value === "active" ? "Every order has been handed over." : "No orders are at this stage right now."}
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {queue.map((order) => <li key={order.id}><OrderTicket order={order} /></li>)}
        </ul>
      )}
    </div>
  );
}

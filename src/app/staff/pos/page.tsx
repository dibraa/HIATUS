import type { Metadata } from "next";
import { getServerToken } from "@/lib/server-token";
import { apiJson } from "@/lib/api-client";
import { PageHeader } from "@/components/ui/page-header";
import { FilterTabs } from "@/components/ui/filter-tabs";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatPrice } from "@/lib/format";
import type { TodaySummary } from "@/types/database";
import { PaymentPanel, type PosOrder } from "./payment-panel";
import { AutoRefresh } from "@/components/auto-refresh";

export const metadata: Metadata = { title: "POS" };
export const dynamic = "force-dynamic";

const TABS = [
  { label: "Awaiting payment", value: "unpaid" },
  { label: "Settled", value: "paid" },
  { label: "Refunded / voided", value: "reversed" },
];

export default async function PosPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab = "unpaid" } = await searchParams;
  const token = await getServerToken();

  const [summary, allOrders] = await Promise.all([
    apiJson<TodaySummary>("/analytics/today", { token: token ?? undefined }).catch(() => null),
    apiJson<(PosOrder & { _id: string })[]>("/orders", { token: token ?? undefined }).catch(() => []),
  ]);

  const list = allOrders
    .map((o) => ({
      ...o,
      id: o._id ?? o.id,
      order_items: ((o as unknown as { items: (import("@/types/database").OrderItem & { _id?: string })[] }).items ?? []).map((item) => ({
        ...item,
        id: item._id ?? item.id,
      })),
      profiles: (o as unknown as { user_id: unknown }).user_id as { full_name: string | null } | null,
    }))
    .filter((o) => {
      if (tab === "paid") return o.payment_status === "paid";
      if (tab === "reversed") return o.payment_status === "refunded" || o.payment_status === "voided";
      return o.payment_status === "unpaid" && o.status !== "cancelled";
    });

  const outstanding = list
    .filter((o) => o.payment_status === "unpaid")
    .reduce((sum, o) => sum + o.total_amount, 0);

  return (
    <div>
      <AutoRefresh seconds={20} />
      <PageHeader title="Point of sale" description="Manage orders, take payment, and correct transactions at the counter." />

      {summary && (
        <div className="mb-6">
          <StatGrid>
            <StatCard label="Awaiting payment" value={summary.unpaid_now} tone={summary.unpaid_now > 0 ? "attention" : "default"} hint="Across all open orders" />
            <StatCard label="On this screen" value={formatPrice(outstanding)} hint="Outstanding in the list below" />
            <StatCard label="Taken today" value={formatPrice(summary.revenue_today)} tone="positive" hint="Completed orders" />
            <StatCard label="Orders today" value={summary.orders_today} hint="Completed" />
          </StatGrid>
        </div>
      )}

      <FilterTabs
        label="Filter orders by payment state"
        className="mb-6"
        tabs={TABS.map((t) => ({ label: t.label, href: `/staff/pos?tab=${t.value}`, active: tab === t.value }))}
      />

      {list.length === 0 ? (
        <EmptyState
          title={tab === "unpaid" ? "Everything is settled" : "Nothing here"}
          body={tab === "unpaid" ? "No open order is waiting on payment right now." : "No orders match this view yet."}
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {list.map((order) => <li key={order.id}><PaymentPanel order={order} /></li>)}
        </ul>
      )}
    </div>
  );
}

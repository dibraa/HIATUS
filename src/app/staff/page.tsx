import type { Metadata } from "next";
import { getServerToken } from "@/lib/server-token";
import { apiJson } from "@/lib/api-client";
import { getSettings } from "@/lib/settings";
import { formatPrice } from "@/lib/format";
import { DataError } from "@/components/ui/data-error";
import { FilterTabs } from "@/components/ui/filter-tabs";
import { ACTIVE_STATUSES } from "@/lib/order-meta";
import { USE_MOCKS, MOCK_QUEUE, MOCK_SUMMARY } from "@/lib/mock-staff-data";
import type { OrderItem, OrderStatus, TodaySummary } from "@/types/database";
import type { QueueOrder } from "@/types/staff";
import { QueueBoard } from "./queue-board";
import { QueueSummary } from "./queue-summary";
import { AutoRefresh } from "@/components/auto-refresh";

export const metadata: Metadata = { title: "Order queue" };
export const dynamic = "force-dynamic";

const TABS: { label: string; value: string; statuses: OrderStatus[] }[] = [
  { label: "All", value: "active", statuses: ACTIVE_STATUSES },
  { label: "New", value: "pending", statuses: ["pending"] },
  { label: "Making", value: "preparing", statuses: ["preparing"] },
  { label: "Ready", value: "ready", statuses: ["ready"] },
];

const STAGE_RANK: Partial<Record<OrderStatus, number>> = { ready: 0, pending: 1, preparing: 2 };

export default async function StaffQueuePage({ searchParams }: { searchParams: Promise<{ tab?: string; q?: string }> }) {
  const { tab = "active", q = "" } = await searchParams;
  const active = TABS.find((t) => t.value === tab) ?? TABS[0];

  let allOrders: QueueOrder[];
  let ordersToday: number;
  let prep = 10;

  if (USE_MOCKS) {
    allOrders = MOCK_QUEUE;
    ordersToday = MOCK_SUMMARY.ordersToday;
  } else {
    const token = await getServerToken();
    let summary: TodaySummary | null;
    let fetched: (QueueOrder & { _id: string })[];
    try {
      [summary, fetched] = await Promise.all([
        apiJson<TodaySummary>("/analytics/today", { token: token ?? undefined }),
        apiJson<(QueueOrder & { _id: string })[]>("/orders", { token: token ?? undefined }),
      ]);
    } catch {
      return (
        <div>
          <AutoRefresh seconds={15} />
          <DataError title="Couldn't load the queue" body="Check your connection and try again." showRetry />
        </div>
      );
    }
    const settings = await getSettings();
    prep = settings.ordering.default_prep_minutes;
    ordersToday = summary?.orders_today ?? 0;
    allOrders = fetched.map((o) => ({
      ...o,
      id: o._id ?? o.id,
      order_items: ((o as unknown as { items: (OrderItem & { _id?: string })[] }).items ?? []).map((item) => ({
        ...item,
        id: item._id ?? item.id,
      })),
      profiles: (o as unknown as { user_id: unknown }).user_id as { full_name: string | null; phone: string | null } | null,
    }));
  }

  const open = allOrders
    .filter((o) => ACTIVE_STATUSES.includes(o.status))
    .sort(
      (a, b) =>
        (STAGE_RANK[a.status] ?? 9) - (STAGE_RANK[b.status] ?? 9) ||
        (b.priority ?? 0) - (a.priority ?? 0) ||
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  const queue = open.filter((o) => active.statuses.includes(o.status));

  const renderedAt = new Date();
  const waits = open
    .filter((o) => o.status !== "ready")
    .map((o) => (renderedAt.getTime() - new Date(o.created_at).getTime()) / 60000);
  const avgWait = waits.length ? Math.round(waits.reduce((s, w) => s + w, 0) / waits.length) : 0;
  const late = waits.filter((w) => w >= prep).length;
  const toCollect = open.filter((o) => o.payment_status === "unpaid").reduce((s, o) => s + o.total_amount, 0);
  const count = (statuses: OrderStatus[]) => open.filter((o) => statuses.includes(o.status)).length;

  return (
    <div>
      <AutoRefresh seconds={15} />
      <p className="ui-caps text-2xs text-muted">Counter operations</p>
      <h1 className="display mt-1 text-4xl text-ink">Order Queue</h1>

      <div className="mt-4">
        <QueueSummary
          open={open.length}
          avgWait={avgWait}
          late={late}
          toCollect={formatPrice(toCollect).replace(".00", "")}
          today={ordersToday}
        />
      </div>

      <FilterTabs
        label="Filter by stage"
        className="mb-3 mt-4"
        tabs={TABS.map((t) => ({
          label: t.label,
          href: `/staff?tab=${t.value}`,
          active: t.value === active.value,
          count: count(t.statuses),
        }))}
      />

      <QueueBoard
        key={active.value}
        orders={queue}
        renderedAt={renderedAt.toISOString()}
        lateAfter={prep}
        overAfter={Math.round(prep * 1.5)}
        query={q}
        emptyTitle={active.value === "active" ? "All orders fulfilled!" : "Nothing here"}
        emptyBody={
          active.value === "active"
            ? `Every ticket is handed over. ${ordersToday} today so far.`
            : "No orders are at this stage right now."
        }
      />
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { getServerToken } from "@/lib/server-token";
import { apiJson } from "@/lib/api-client";
import { getSettings } from "@/lib/settings";
import { formatPrice } from "@/lib/format";
import { DataError } from "@/components/ui/data-error";
import { ACTIVE_STATUSES } from "@/lib/order-meta";
import type { OrderItem, OrderStatus, TodaySummary } from "@/types/database";
import type { QueueOrder } from "./order-ticket";
import { QueueBoard } from "./queue-board";
import { AutoRefresh } from "@/components/auto-refresh";

export const metadata: Metadata = { title: "Order queue" };
export const dynamic = "force-dynamic";

const TABS: { label: string; value: string; statuses: OrderStatus[] }[] = [
  { label: "All", value: "active", statuses: ACTIVE_STATUSES },
  { label: "New", value: "pending", statuses: ["pending"] },
  { label: "Making", value: "preparing", statuses: ["preparing"] },
  { label: "Ready", value: "ready", statuses: ["ready"] },
];

/** Ready to hand over first, then new, then making — oldest first within each. */
const STAGE_RANK: Partial<Record<OrderStatus, number>> = { ready: 0, pending: 1, preparing: 2 };

/**
 * The counter queue: a summary strip (the room's state in one line), stage
 * filters, and the unified table (queue-board.tsx). Data and actions are the
 * same as before — /orders, /analytics/today and the actions in
 * actions/staff.ts; only the presentation changed.
 */
export default async function StaffQueuePage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab = "active" } = await searchParams;
  const active = TABS.find((t) => t.value === tab) ?? TABS[0];
  const token = await getServerToken();

  let summary: TodaySummary | null;
  let allOrders: (QueueOrder & { _id: string })[];
  try {
    [summary, allOrders] = await Promise.all([
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
  const prep = settings.ordering.default_prep_minutes;

  const open = allOrders
    .filter((o) => ACTIVE_STATUSES.includes(o.status))
    .map((o) => ({
      ...o,
      id: o._id ?? o.id,
      order_items: ((o as unknown as { items: (OrderItem & { _id?: string })[] }).items ?? []).map((item) => ({
        ...item,
        id: item._id ?? item.id,
      })),
      profiles: (o as unknown as { user_id: unknown }).user_id as { full_name: string | null; phone: string | null } | null,
    }))
    .sort(
      (a, b) =>
        (STAGE_RANK[a.status] ?? 9) - (STAGE_RANK[b.status] ?? 9) ||
        (b.priority ?? 0) - (a.priority ?? 0) ||
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
  const queue = open.filter((o) => active.statuses.includes(o.status));

  // The summary strip, computed from the same open orders the table shows.
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
      <h1 className="sr-only">Order queue</h1>

      <dl className="no-scrollbar mb-3 flex gap-7 overflow-x-auto whitespace-nowrap border-b border-line pb-3">
        <Stat value={String(open.length)} label="open" />
        <Stat value={`${avgWait}m`} label="avg wait" />
        <Stat value={String(late)} label="late" />
        <Stat value={formatPrice(toCollect).replace(".00", "")} label="to collect" />
        <Stat value={String(summary?.orders_today ?? 0)} label="orders today" />
      </dl>

      <nav aria-label="Filter by stage" className="mb-3 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={`/staff?tab=${t.value}`}
            aria-current={t.value === active.value ? "page" : undefined}
            className={`ui-caps inline-flex min-h-12 items-center gap-2 rounded-xl border px-4 text-2xs transition-colors ${
              t.value === active.value
                ? "border-ink bg-ink text-surface"
                : "border-line-strong bg-card text-ink hover:border-ink"
            }`}
          >
            {t.label} <span className="display text-lg leading-none">{count(t.statuses)}</span>
          </Link>
        ))}
      </nav>

      <QueueBoard
        // A new tab is a new view: reset which orders count as "already seen".
        key={active.value}
        orders={queue}
        renderedAt={renderedAt.toISOString()}
        lateAfter={prep}
        overAfter={Math.round(prep * 1.5)}
        emptyTitle={active.value === "active" ? "Nothing in the queue" : "Nothing here"}
        emptyBody={
          active.value === "active"
            ? `Every order has been handed over. ${summary?.orders_today ?? 0} today so far.`
            : "No orders are at this stage right now."
        }
      />
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <dt className="sr-only">{label}</dt>
      <dd className="flex items-baseline gap-1.5">
        <span className="display text-2xl text-ink">{value}</span>
        <span aria-hidden="true" className="ui-caps text-2xs text-muted">
          {label}
        </span>
      </dd>
    </div>
  );
}

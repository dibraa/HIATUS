import type { Metadata } from "next";
import { getServerToken } from "@/lib/server-token";
import { apiJson } from "@/lib/api-client";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { DataError } from "@/components/ui/data-error";
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
        <PageHeader title="Order Queue" description="Newest at the bottom, longest wait at the top." />
        <DataError
          title="Couldn't load queue"
          body="Check your connection and try again."
        />
      </div>
    );
  }

  const queue = allOrders
    .filter((o) => active.statuses.includes(o.status))
    .map((o) => ({
      ...o,
      id: o._id ?? o.id,
      order_items: ((o as unknown as { items: (import("@/types/database").OrderItem & { _id?: string })[] }).items ?? []).map((item) => ({
        ...item,
        id: item._id ?? item.id,
      })),
      profiles: (o as unknown as { user_id: unknown }).user_id as { full_name: string | null; phone: string | null } | null,
    }))
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0) || new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const newCount = summary?.pending_now ?? 0;
  const readyCount = summary?.ready_now ?? 0;

  return (
    <div>
      <AutoRefresh seconds={15} />
      <PageHeader
        title="Order Queue"
        description="Newest at the bottom, longest wait at the top."
        action={
          <div className="flex items-center gap-6">
            {newCount > 0 && (
              <div className="text-right">
                <p className="display text-2xl text-accent">{newCount}</p>
                <p className="text-xs text-muted">New</p>
              </div>
            )}
            {readyCount > 0 && (
              <div className="text-right">
                <p className="display text-2xl text-success-soft-fg">{readyCount}</p>
                <p className="text-xs text-muted">Ready</p>
              </div>
            )}
          </div>
        }
      />

      {/* Filter tabs — simple text links, not buttons */}
      <div className="mb-6 flex gap-6 border-b border-line pb-3">
        {TABS.map((t) => (
          <a
            key={t.value}
            href={`/staff?tab=${t.value}`}
            aria-current={t.value === active.value ? "page" : undefined}
            className={
              t.value === active.value
                ? "display text-sm text-ink"
                : "text-sm text-muted transition-colors hover:text-ink"
            }
          >
            {t.label}
          </a>
        ))}
      </div>

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

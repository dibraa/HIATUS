import type { Metadata } from "next";
import { getServerToken } from "@/lib/server-token";
import { apiJson } from "@/lib/api-client";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { DataError } from "@/components/ui/data-error";
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

  let summary: TodaySummary | null;
  let allOrders: (PosOrder & { _id: string })[];
  try {
    [summary, allOrders] = await Promise.all([
      apiJson<TodaySummary>("/analytics/today", { token: token ?? undefined }),
      apiJson<(PosOrder & { _id: string })[]>("/orders", { token: token ?? undefined }),
    ]);
  } catch {
    return (
      <div>
        <AutoRefresh seconds={20} />
        <PageHeader title="Point of Sale" description="Take payment and correct transactions at the counter." />
        <DataError
          title="Couldn't load POS"
          body="Check your connection and try again."
        />
      </div>
    );
  }

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
      <PageHeader
        title="Point of Sale"
        description="Take payment and correct transactions at the counter."
        action={
          outstanding > 0 ? (
            <div className="text-right">
              <p className="display text-2xl text-accent">{formatPrice(outstanding)}</p>
              <p className="text-xs text-muted">Outstanding</p>
            </div>
          ) : undefined
        }
      />

      {/* Filter tabs — simple text links, not buttons */}
      <div className="mb-6 flex gap-6 border-b border-line pb-3">
        {TABS.map((t) => (
          <a
            key={t.value}
            href={`/staff/pos?tab=${t.value}`}
            aria-current={tab === t.value ? "page" : undefined}
            className={
              tab === t.value
                ? "display text-sm text-ink"
                : "text-sm text-muted transition-colors hover:text-ink"
            }
          >
            {t.label}
          </a>
        ))}
      </div>

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

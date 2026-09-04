import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { FilterTabs } from "@/components/ui/filter-tabs";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { FormError } from "@/components/ui/field";
import { formatPrice } from "@/lib/format";
import type { TodaySummary } from "@/types/database";
import { PaymentPanel, type PosOrder } from "./payment-panel";
import { AutoRefresh } from "@/components/auto-refresh";

export const metadata: Metadata = { title: "Payments" };

export const dynamic = "force-dynamic";

const TABS = [
  { label: "Awaiting payment", value: "unpaid" },
  { label: "Settled", value: "paid" },
  { label: "Refunded / voided", value: "reversed" },
];

const SELECT =
  "id, status, order_type, table_label, payment_method, payment_status, " +
  "subtotal_amount, discount_amount, total_amount, promo_code, created_at, paid_at, " +
  "profiles(full_name), order_items(*)";

export default async function PosPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab = "unpaid" } = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("orders").select(SELECT);

  if (tab === "paid") {
    query = query.eq("payment_status", "paid").order("paid_at", { ascending: false });
  } else if (tab === "reversed") {
    query = query
      .in("payment_status", ["refunded", "voided"])
      .order("updated_at", { ascending: false });
  } else {
    // Unpaid tickets the shop still owes something on. A cancelled order that
    // was never paid is settled by definition — nobody owes anybody.
    query = query
      .eq("payment_status", "unpaid")
      .neq("status", "cancelled")
      .order("created_at", { ascending: true });
  }

  const [{ data: summaryRows }, { data: orders, error }] = await Promise.all([
    supabase.rpc("today_summary", { tz: "Asia/Manila" }),
    query.limit(50).returns<PosOrder[]>(),
  ]);

  const summary = (summaryRows as TodaySummary[] | null)?.[0] ?? null;
  const list = orders ?? [];

  const outstanding = list
    .filter((o) => o.payment_status === "unpaid")
    .reduce((sum, o) => sum + o.total_amount, 0);

  return (
    <div>
      <AutoRefresh seconds={20} />

      <PageHeader
        title="Payments"
        description="Take payment, give change, and reverse a transaction when something goes wrong."
      />

      {summary && (
        <div className="mb-6">
          <StatGrid>
            <StatCard
              label="Awaiting payment"
              value={summary.unpaid_now}
              tone={summary.unpaid_now > 0 ? "attention" : "default"}
              hint="Across all open orders"
            />
            <StatCard
              label="On this screen"
              value={formatPrice(outstanding)}
              hint="Outstanding in the list below"
            />
            <StatCard
              label="Taken today"
              value={formatPrice(summary.revenue_today)}
              tone="positive"
              hint="Completed orders"
            />
            <StatCard
              label="Orders today"
              value={summary.orders_today}
              hint="Completed"
            />
          </StatGrid>
        </div>
      )}

      <FilterTabs
        label="Filter orders by payment state"
        className="mb-6"
        tabs={TABS.map((t) => ({
          label: t.label,
          href: `/staff/pos?tab=${t.value}`,
          active: tab === t.value,
        }))}
      />

      {error ? (
        <FormError>{error.message}</FormError>
      ) : list.length === 0 ? (
        <EmptyState
          title={tab === "unpaid" ? "Everything is settled" : "Nothing here"}
          body={
            tab === "unpaid"
              ? "No open order is waiting on payment right now."
              : "No orders match this view yet."
          }
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {list.map((order) => (
            <li key={order.id}>
              <PaymentPanel order={order} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

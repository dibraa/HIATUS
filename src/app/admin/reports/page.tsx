import type { Metadata } from "next";
import { getServerToken } from "@/lib/server-token";
import { apiJson } from "@/lib/api-client";
import { PageHeader } from "@/components/ui/page-header";
import { FilterTabs } from "@/components/ui/filter-tabs";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Hairline } from "@/components/ui/hairline";
import { formatPrice } from "@/lib/format";
import type { BestSellingFlavor, PopularItemRow, SalesReportRow } from "@/types/database";
import { SalesChart } from "./charts";
import { ItemsTable } from "./items-table";
import { BestSellerChart } from "../best-seller-chart";

export const metadata: Metadata = { title: "Reports" };
export const dynamic = "force-dynamic";

const RANGES = [
  { label: "Last 7 days", value: "7d", days: 7, grain: "day" as const },
  { label: "Last 30 days", value: "30d", days: 30, grain: "day" as const },
  { label: "Last 12 months", value: "12m", days: 365, grain: "month" as const },
];

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const { range = "30d" } = await searchParams;
  const selected = RANGES.find((r) => r.value === range) ?? RANGES[1];
  const token = await getServerToken();

  const [salesRaw, itemsRaw, flavorsRaw] = await Promise.all([
    apiJson<SalesReportRow[]>(`/analytics/sales?days=${selected.days}`, { token: token ?? undefined }).catch(() => []),
    apiJson<PopularItemRow[]>("/analytics/popular-items", { token: token ?? undefined }).catch(() => []),
    apiJson<BestSellingFlavor[]>(`/analytics/best-sellers?days=${selected.days}`, { token: token ?? undefined }).catch(() => []),
  ]);

  const netTotal = salesRaw.reduce((sum, r) => sum + r.net_amount, 0);
  const orderTotal = salesRaw.reduce((sum, r) => sum + r.order_count, 0);
  const discountTotal = salesRaw.reduce((sum, r) => sum + r.discount_amount, 0);

  return (
    <div>
      <PageHeader title="Reports" description="Revenue and demand over a period you choose." />

      <FilterTabs
        label="Choose a reporting period"
        className="mb-6"
        tabs={RANGES.map((r) => ({ label: r.label, href: `/admin/reports?range=${r.value}`, active: r.value === selected.value }))}
      />

      <StatGrid>
        <StatCard label="Net revenue" value={formatPrice(netTotal)} hint={selected.label.toLowerCase()} tone="positive" />
        <StatCard label="Orders" value={orderTotal} hint="Completed" />
        <StatCard label="Average order" value={formatPrice(orderTotal === 0 ? 0 : netTotal / orderTotal)} hint="Net, per order" />
        <StatCard label="Discounts given" value={formatPrice(discountTotal)} hint="Manual adjustments" />
      </StatGrid>

      <section aria-labelledby="revenue-heading" className="mt-10">
        <Hairline className="mb-6" />
        <h2 id="revenue-heading" className="display text-xl text-ink mb-4">Revenue</h2>
        <SalesChart data={salesRaw} grain={selected.grain} />
      </section>

      <section aria-labelledby="items-heading" className="mt-10">
        <Hairline className="mb-6" />
        <h2 id="items-heading" className="display text-xl text-ink mb-4">What sells</h2>
        {itemsRaw.length === 0 ? (
          <EmptyState as="h3" title="Nothing sold in this range" body="Try a longer period." />
        ) : (
          <ItemsTable items={itemsRaw} />
        )}
      </section>

      <section aria-labelledby="flavors-heading" className="mt-10">
        <Hairline className="mb-6" />
        <h2 id="flavors-heading" className="display text-xl text-ink mb-4">Best-selling flavours</h2>
        <BestSellerChart data={flavorsRaw} />
      </section>
    </div>
  );
}

import type { Metadata } from "next";
import { getServerToken } from "@/lib/supabase/server";
import { apiJson } from "@/lib/api-client";
import { PageHeader } from "@/components/ui/page-header";
import { FilterTabs } from "@/components/ui/filter-tabs";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { CheckerBand } from "@/components/ui/checker";
import { formatPrice } from "@/lib/format";
import type { BestSellingFlavor, PopularItemRow, SalesReportRow } from "@/types/database";
import { SalesChart } from "./charts";
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
        <StatCard label="Discounts given" value={formatPrice(discountTotal)} hint="Promos and manual" />
      </StatGrid>

      <section aria-labelledby="revenue-heading" className="mt-10">
        <CheckerBand className="mb-6" />
        <h2 id="revenue-heading" className="display text-xl text-ink mb-4">Revenue</h2>
        <SalesChart data={salesRaw} grain={selected.grain} />
      </section>

      <section aria-labelledby="items-heading" className="mt-10">
        <CheckerBand className="mb-6" />
        <h2 id="items-heading" className="display text-xl text-ink mb-4">What sells</h2>
        {itemsRaw.length === 0 ? (
          <EmptyState as="h3" title="Nothing sold in this range" body="Try a longer period." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead>
                <tr className="border-b border-line eyebrow text-muted">
                  <th scope="col" className="py-2 pr-4 font-medium">Item</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Flavor</th>
                  <th scope="col" className="py-2 pr-4 text-right font-medium">Units</th>
                  <th scope="col" className="py-2 text-right font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {itemsRaw.map((row) => (
                  <tr key={`${row.item_name}-${row.flavor}`} className="border-b border-line last:border-0">
                    <th scope="row" className="py-2.5 pr-4 text-left font-medium text-ink">{row.item_name}</th>
                    <td className="py-2.5 pr-4 text-ink-soft">{row.flavor}</td>
                    <td className="py-2.5 pr-4 text-right font-semibold numeric text-ink">{row.total_quantity}</td>
                    <td className="py-2.5 text-right numeric text-ink-soft">{formatPrice(row.total_revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-labelledby="flavors-heading" className="mt-10">
        <CheckerBand className="mb-6" />
        <h2 id="flavors-heading" className="display text-xl text-ink mb-4">Best-selling flavours</h2>
        <BestSellerChart data={flavorsRaw} />
      </section>
    </div>
  );
}

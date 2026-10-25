import type { Metadata } from "next";
import { getServerToken } from "@/lib/server-token";
import { apiJson } from "@/lib/api-client";
import { AdminPageHeader as PageHeader } from "@/components/admin-page-header";
import { DataError } from "@/components/ui/data-error";
import { ReportFilter } from "./report-filter";
import { ExcelExportButton } from "./excel-export-button";
import type { IntegrationSettings } from "@/lib/integrations";
import { AdminStatCard as StatCard } from "@/components/admin-stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatPrice } from "@/lib/format";
import type { BestSellingFlavor, PopularItemRow, SalesReportRow } from "@/types/database";
import { SalesChart } from "./charts";
import { ItemsTable } from "./items-table";

import { BestSellerChart } from "../best-seller-chart";

export const metadata: Metadata = { title: "Reports" };
export const dynamic = "force-dynamic";

type Report = { flavors: BestSellingFlavor[]; rows: SalesReportRow[]; items: PopularItemRow[]; totals: { net_amount: number; order_count: number; discount_amount: number; average_order_value: number } };

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ period?: string; date?: string }> }) {
  const search = await searchParams;
  const period = search.period || "monthly";
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const date = search.date || (period === "annual" ? today.slice(0, 4) : period === "daily" ? today : today.slice(0, 7));
  const query = new URLSearchParams({ period, date });
  const token = await getServerToken();
  const options = { token: token ?? undefined, cache: "no-store" as const };
  let report: Report | null = null;
  let reportError = "";
  let exportEnabled: boolean | null = null;
  await Promise.all([
    apiJson<Report>(`/analytics/report?${query}`, options).then(value => { report = value; }).catch((error: Error) => { reportError = error.message; }),
    apiJson<IntegrationSettings>("/settings/integrations", options).then(value => { exportEnabled = value.report_export_enabled; }).catch(() => {}),
  ]);
  if (!report) return <div><PageHeader title="Reports" description="Daily, monthly, and annual sales reports." /><ReportFilter key={period + date} period={period} date={date} /><DataError title="Report unavailable" body={reportError || "Please try again."} /></div>;
  const data = report as Report;
  const salesRaw = data.rows, itemsRaw = data.items;
  const { net_amount: netTotal, order_count: orderTotal, discount_amount: discountTotal } = data.totals;
  const flavorsRaw = data.flavors;
  const grain = period === "annual" ? "month" : "day";
  return (
    <div>
      <PageHeader title="Reports" description="Daily, monthly, and annual sales reports." action={<ExcelExportButton period={period} date={date} enabled={exportEnabled} />} />

      <ReportFilter key={period + date} period={period} date={date} />

      <div className="admin-stats">
        <StatCard label="Net revenue" value={formatPrice(netTotal)} hint={date} tone="positive" />
        <StatCard label="Orders" value={orderTotal} hint="Paid and completed" />
        <StatCard label="Average order" value={formatPrice(orderTotal === 0 ? 0 : netTotal / orderTotal)} hint="Net, per order" />
        <StatCard label="Discounts given" value={formatPrice(discountTotal)} hint="Manual adjustments" />
      </div>

      <section aria-labelledby="revenue-heading" className="admin-panel admin-report-section">
        <h2 id="revenue-heading" className="display text-xl text-ink mb-4">Revenue</h2>
        <SalesChart data={salesRaw} grain={grain} />
      </section>

      <section aria-labelledby="items-heading" className="admin-panel admin-report-section">
        <h2 id="items-heading" className="display text-xl text-ink mb-4">What sells</h2>
        <p className="mb-4 text-sm text-muted">Item and flavour sales show subtotals before order discounts.</p>
        {itemsRaw.length === 0 ? (
          <EmptyState as="h3" title="Nothing sold in this range" body="Try a longer period." />
        ) : (
          <ItemsTable items={itemsRaw} />
        )}
      </section>

      <section aria-labelledby="flavors-heading" className="admin-panel admin-report-section">
        <h2 id="flavors-heading" className="display text-xl text-ink mb-4">Best-selling flavours</h2>
        <BestSellerChart data={flavorsRaw} />
      </section>
    </div>
  );
}

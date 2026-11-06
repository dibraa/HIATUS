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

import { ReportTabs } from "./report-tabs";
import { ReconciliationWorkspace } from "./reconciliation";
import { readCloseout } from "@/app/actions/reconciliation";
import { CustomerTable, TransactionTable, DisputeList, NewDispute, HourChart } from "./finance-views";
import { AdminPagination } from "@/components/admin-pagination";
import type { AdminSearch } from "@/lib/activity";
import type { ReportView, PeakHour, CustomerReport, LedgerReport, DisputeReport } from "@/lib/finance";
type Report = { flavors: BestSellingFlavor[]; rows: SalesReportRow[]; items: PopularItemRow[]; peak_hours: PeakHour[]; totals: { net_amount: number; order_count: number; discount_amount: number; average_order_value: number } };
function SalesPanels({ data, period, date }: { data: Report; period: string; date: string }) {
  const salesRaw = data.rows, itemsRaw = data.items;
  const { net_amount: netTotal, order_count: orderTotal, discount_amount: discountTotal } = data.totals;
  const flavorsRaw = data.flavors;
  const grain = period === "annual" ? "month" : "day";
  return (
    <div>

      <div className="admin-stats">
        <StatCard label="Net revenue" value={formatPrice(netTotal)} hint={date} tone="positive" />
        <StatCard label="Orders" value={orderTotal} hint="Paid and completed" />
        <StatCard label="Average order" value={formatPrice(orderTotal === 0 ? 0 : netTotal / orderTotal)} hint="Net, per order" />
        <StatCard label="Discounts given" value={formatPrice(discountTotal)} />
      </div>

      <section aria-labelledby="revenue-heading" className="admin-panel admin-report-section">
        <h2 id="revenue-heading" className="display text-xl text-ink mb-4">Revenue</h2>
        <SalesChart data={salesRaw} grain={grain} />
      </section>

      <section aria-labelledby="items-heading" className="admin-panel admin-report-section">
        <h2 id="items-heading" className="display text-xl text-ink mb-4">What sells</h2>
        <p className="mb-4 text-sm text-muted">Before order discounts.</p>
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
      <HourChart data={data.peak_hours} title="Peak ordering hours" description="Orders by Manila placement hour, including preparation; cancelled orders excluded." />
    </div>
  );
}

export default async function ReportsPage({ searchParams }: { searchParams: Promise<AdminSearch> }) {
  const search = await searchParams;
  const get = (key: string) => typeof search[key] === "string" ? search[key] as string : "";
  if (get("view") === "reconciliation") {
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    const date = get("date") || today, result = await readCloseout(date);
    return <div className="admin-reports"><PageHeader title="Reports" /><ReportTabs view="reconciliation" period="daily" date={date} today={today} />{result.data ? <ReconciliationWorkspace key={date} initial={result.data} today={today} /> : <DataError title="Closeout unavailable" body={result.error || "Please try again."} showRetry />}</div>;
  }
  const view = (["sales", "customers", "transactions", "refunds"].includes(get("view")) ? get("view") : "sales") as ReportView;
  const financial = view === "transactions" || view === "refunds";
  const period = get("period") || (financial ? "all" : "monthly");
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const date = period === "all" ? "" : get("date") || (period === "annual" ? today.slice(0, 4) : period === "daily" ? today : today.slice(0, 7));
  const query = new URLSearchParams({ view, period });
  if (date) query.set("date", date);
  for (const key of ["search", "kind", "method", "status", "page", "case_page", "order"]) if (get(key)) query.set(key, get(key));
  const token = await getServerToken();
  const options = { token: token ?? undefined, cache: "no-store" as const };
  let report: Report | CustomerReport | LedgerReport | null = null;
  let reportError = "", caseError = "";
  let cases: DisputeReport | null = null;
  let exportEnabled: boolean | null = null;
  const apiQuery = new URLSearchParams(query);
  if (view === "refunds") apiQuery.set("kind", "refund");
  const endpoint = view === "sales" ? "/analytics/report" : view === "customers" ? "/admin/finance/customers" : "/admin/finance/transactions";
  await Promise.all([
    apiJson<Report | CustomerReport | LedgerReport>(endpoint + "?" + apiQuery, options).then(value => { report = value; }).catch((error: Error) => { reportError = error.message; }),
    apiJson<IntegrationSettings>("/settings/integrations/options", options).then(value => { exportEnabled = value.report_export_enabled; }).catch(() => {}),
    ...(view === "refunds" ? [apiJson<DisputeReport>("/admin/finance/disputes?" + new URLSearchParams({ ...Object.fromEntries(query), page: get("case_page") || "1" }), options).then(value => { cases = value; }).catch((error: Error) => { caseError = error.message; })] : []),
  ]);
  const exports = Object.fromEntries(["search", "kind", "method", "status", "order"].map(key => [key, get(key)]));
  const data = report as Report | CustomerReport | LedgerReport | null;
  const ledger = data as LedgerReport;
  const customer = data as CustomerReport;
  const disputeData = cases as DisputeReport | null;
  return <div className="admin-reports">
    <PageHeader title="Reports" action={<ExcelExportButton period={period} date={date} view={view} enabled={exportEnabled} filters={exports} />} />
    <ReportTabs view={view} period={period} date={date} today={today} />
    <ReportFilter key={query.toString()} view={view} period={period} date={date} search={get("search")} kind={get("kind")} method={get("method")} status={get("status")} order={get("order")} />
    {!data ? <DataError title="Report unavailable" body={reportError || "Please try again."} /> : view === "sales" ? <SalesPanels data={data as Report} period={period} date={date} /> : view === "customers" ? <>
      <div className="admin-stats"><StatCard label="Purchasing customers" value={customer.summary.customers} hint="Known accounts" /><StatCard label="New purchasers" value={customer.summary.new_customers} hint="First purchase in this period" /><StatCard label="Returning purchasers" value={customer.summary.returning} hint="Purchased before this period" /><StatCard label="Average spend" value={formatPrice(customer.summary.average_spend)} hint="Per purchasing customer" /></div>
      <p className="mb-5 text-sm text-muted">{customer.summary.repeat} customers purchased at least twice in this period. {customer.summary.orders_per_customer.toFixed(2)} purchases per customer. Deleted-account purchases remain in sales totals but are excluded from customer comparisons.</p>
      <CustomerTable key={query.toString()} items={customer.items} period={period} date={date} />
      <AdminPagination path="/admin/reports" query={query} page={customer.page} pageSize={20} total={customer.total} label="Customer analytics pages" />
      <HourChart data={customer.hours} title="Customer ordering times" description="Paid, completed purchases by Manila hour for matching customers." />
    </> : <>
      <div className="admin-stats">{view === "transactions" ? <><StatCard label="Collections" value={formatPrice(ledger.totals.payments)} hint="Payment records" /><StatCard label="Refunds" value={formatPrice(ledger.totals.refunds)} hint="Returned payments" /><StatCard label="Paid voids" value={formatPrice(ledger.totals.voids)} hint="Unpaid voids contribute zero" /><StatCard label="Net collections" value={formatPrice(ledger.totals.net)} hint="Payments less reversals" /></> : <><StatCard label="Refund total" value={formatPrice(ledger.totals.refunds)} hint="Recorded refunds" /><StatCard label="Refund records" value={ledger.total} hint="Matching filters" /><StatCard label="Dispute cases" value={disputeData ? disputeData.total : "Unavailable"} hint="Matching case filters" /><StatCard label="Needs review" value={ledger.totals.conflicts} hint="Excluded from financial totals" /></>}</div>
      {ledger.totals.conflicts > 0 && <p role="status" className="mb-5 rounded-md border border-danger p-4 text-sm text-danger">{ledger.totals.conflicts} conflicting ledger records need review and are excluded from financial totals. Inspect their legacy sources in Details.</p>}
      <TransactionTable items={ledger.items} />
      <AdminPagination path="/admin/reports" query={query} page={ledger.page} pageSize={20} total={ledger.total} label={view === "refunds" ? "Refund records pages" : "Transaction records pages"} />
      {view === "refunds" && <section className="admin-panel admin-report-section" aria-labelledby="disputes-heading"><h2 id="disputes-heading" className="text-xl font-semibold">Dispute cases</h2><p className="my-3 text-sm text-muted">Creating or resolving a case does not transfer money.</p><NewDispute key={get("order")} initialOrder={get("order")} />{caseError ? <DataError title="Cases unavailable" body={caseError} /> : disputeData && <><DisputeList items={disputeData.items} /><AdminPagination path="/admin/reports" query={query} page={disputeData.page} pageSize={20} total={disputeData.total} pageKey="case_page" label="Dispute cases pages" /></>}</section>}
    </>}
  </div>;
}

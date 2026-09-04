import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { FilterTabs } from "@/components/ui/filter-tabs";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { CheckerBand } from "@/components/ui/checker";
import { formatPrice, formatDate } from "@/lib/format";
import type {
  BestSellingFlavor,
  CustomerSummary,
  PeakHourRow,
  PopularItemRow,
  SalesReportRow,
  TopCustomerRow,
} from "@/types/database";
import { SalesChart, PeakHoursChart } from "./charts";
import { ExportButton } from "./export-button";
import { BestSellerChart } from "../best-seller-chart";

export const metadata: Metadata = { title: "Reports" };

export const dynamic = "force-dynamic";

/**
 * Ranges are expressed as a grain plus a lookback, because "annual revenue"
 * and "this month day by day" are the same question at different resolutions —
 * and `sales_report` takes exactly those two parameters.
 */
const RANGES = [
  { label: "Last 7 days", value: "7d", days: 7, grain: "day" as const },
  { label: "Last 30 days", value: "30d", days: 30, grain: "day" as const },
  { label: "Last 12 months", value: "12m", days: 365, grain: "month" as const },
  { label: "By year", value: "all", days: 1825, grain: "year" as const },
];

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range = "30d" } = await searchParams;
  const selected = RANGES.find((r) => r.value === range) ?? RANGES[1];

  const supabase = await createClient();

  const [
    { data: sales },
    { data: hours },
    { data: items },
    { data: flavors },
    { data: customerRows },
    { data: topCustomers },
  ] = await Promise.all([
    supabase.rpc("sales_report", {
      from_date: isoDaysAgo(selected.days),
      to_date: null,
      bucket: selected.grain,
      tz: "Asia/Manila",
    }),
    supabase.rpc("peak_hours", { days_back: selected.days, tz: "Asia/Manila" }),
    supabase.rpc("popular_items", { days_back: selected.days, limit_count: 15 }),
    supabase.rpc("best_selling_flavors", { days_back: selected.days }),
    supabase.rpc("customer_summary", { days_back: selected.days }),
    supabase.rpc("top_customers", { days_back: selected.days, limit_count: 10 }),
  ]);

  const salesRows = (sales as SalesReportRow[] | null) ?? [];
  const hourRows = (hours as PeakHourRow[] | null) ?? [];
  const itemRows = (items as PopularItemRow[] | null) ?? [];
  const flavorRows = (flavors as BestSellingFlavor[] | null) ?? [];
  const customers = (customerRows as CustomerSummary[] | null)?.[0] ?? null;
  const customerRanking = (topCustomers as TopCustomerRow[] | null) ?? [];

  const netTotal = salesRows.reduce((sum, r) => sum + r.net_amount, 0);
  const orderTotal = salesRows.reduce((sum, r) => sum + r.order_count, 0);
  const discountTotal = salesRows.reduce((sum, r) => sum + r.discount_amount, 0);

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Revenue, demand and customers over a period you choose. Every table here exports to CSV."
      />

      <FilterTabs
        label="Choose a reporting period"
        className="mb-6"
        tabs={RANGES.map((r) => ({
          label: r.label,
          href: `/admin/reports?range=${r.value}`,
          active: r.value === selected.value,
        }))}
      />

      <StatGrid>
        <StatCard
          label="Net revenue"
          value={formatPrice(netTotal)}
          hint={selected.label.toLowerCase()}
          tone="positive"
        />
        <StatCard label="Orders" value={orderTotal} hint="Completed" />
        <StatCard
          label="Average order"
          value={formatPrice(orderTotal === 0 ? 0 : netTotal / orderTotal)}
          hint="Net, per order"
        />
        <StatCard
          label="Discounts given"
          value={formatPrice(discountTotal)}
          hint="Promos and manual"
        />
      </StatGrid>

      {/* ---------- Revenue ---------- */}
      <ReportSection
        id="revenue"
        title="Revenue"
        description={`Completed orders only, net of discounts, by ${selected.grain}.`}
        action={
          <ExportButton data={{ kind: "sales", rows: salesRows, grain: selected.grain }} />
        }
      >
        <SalesChart data={salesRows} grain={selected.grain} />
      </ReportSection>

      {/* ---------- Peak hours ---------- */}
      <ReportSection
        id="hours"
        title="When people order"
        description="Order volume by hour of the day, in shop time. Useful for rostering."
        action={<ExportButton data={{ kind: "hours", rows: hourRows }} />}
      >
        <PeakHoursChart data={hourRows} />
      </ReportSection>

      {/* ---------- Items ---------- */}
      <ReportSection
        id="items"
        title="What sells"
        description="Ranked by units sold. Drinks removed from the menu still appear here — the history is what explains why they went."
        action={<ExportButton data={{ kind: "items", rows: itemRows }} />}
      >
        {itemRows.length === 0 ? (
          <EmptyState
            as="h3"
            title="Nothing sold in this range"
            body="Try a longer period, or check back once orders start completing."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <caption className="sr-only">
                Menu items by units sold, with order count and revenue.
              </caption>
              <thead>
                <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
                  <th scope="col" className="py-2 pr-4 font-medium">Item</th>
                  <th scope="col" className="py-2 pr-4 font-medium">Flavor</th>
                  <th scope="col" className="py-2 pr-4 text-right font-medium">Units</th>
                  <th scope="col" className="py-2 pr-4 text-right font-medium">Orders</th>
                  <th scope="col" className="py-2 text-right font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {itemRows.map((row) => (
                  <tr
                    key={`${row.item_name}-${row.flavor}`}
                    className="border-b border-line last:border-0"
                  >
                    <th
                      scope="row"
                      className="py-2.5 pr-4 text-left font-medium text-ink"
                    >
                      {row.item_name}
                    </th>
                    <td className="py-2.5 pr-4 text-ink-soft">{row.flavor}</td>
                    <td className="py-2.5 pr-4 text-right font-semibold tabular-nums text-ink">
                      {row.total_quantity}
                    </td>
                    <td className="py-2.5 pr-4 text-right tabular-nums text-ink-soft">
                      {row.order_count}
                    </td>
                    <td className="py-2.5 text-right tabular-nums text-ink-soft">
                      {formatPrice(row.total_revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ReportSection>

      {/* ---------- Flavours ---------- */}
      <ReportSection
        id="flavors"
        title="Best-selling flavours"
        description="The same sales rolled up by flavour rather than by item — what the shop should keep in stock."
      >
        <BestSellerChart data={flavorRows} />
      </ReportSection>

      {/* ---------- Customers ---------- */}
      <ReportSection
        id="customers"
        title="Customers"
        description="A customer counts as new when their first ever completed order falls inside this period."
        action={<ExportButton data={{ kind: "customers", rows: customerRanking }} />}
      >
        {customers && (
          <div className="mb-6">
            <StatGrid>
              <StatCard label="Customers" value={customers.total_customers} hint="Ordered in this period" />
              <StatCard label="New" value={customers.new_customers} hint="First-ever order" />
              <StatCard label="Returning" value={customers.returning_customers} hint="Had ordered before" />
              <StatCard
                label="Average spend"
                value={formatPrice(customers.average_spend)}
                hint={`${customers.orders_per_customer} orders each`}
              />
            </StatGrid>
          </div>
        )}

        {customerRanking.length === 0 ? (
          <EmptyState
            as="h3"
            title="No customer activity yet"
            body="Once orders complete, your most frequent customers are listed here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[30rem] text-left text-sm">
              <caption className="sr-only">
                Customers ranked by total spend in this period.
              </caption>
              <thead>
                <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
                  <th scope="col" className="py-2 pr-4 font-medium">Customer</th>
                  <th scope="col" className="py-2 pr-4 text-right font-medium">Orders</th>
                  <th scope="col" className="py-2 pr-4 text-right font-medium">Spend</th>
                  <th scope="col" className="py-2 text-right font-medium">Last order</th>
                </tr>
              </thead>
              <tbody>
                {customerRanking.map((row) => (
                  <tr key={row.user_id} className="border-b border-line last:border-0">
                    <th scope="row" className="py-2.5 pr-4 text-left font-medium text-ink">
                      {row.full_name?.trim() || "Unnamed"}
                      {row.phone && (
                        <span className="ml-2 text-xs font-normal text-muted">
                          {row.phone}
                        </span>
                      )}
                    </th>
                    <td className="py-2.5 pr-4 text-right tabular-nums text-ink-soft">
                      {row.order_count}
                    </td>
                    <td className="py-2.5 pr-4 text-right font-semibold tabular-nums text-ink">
                      {formatPrice(row.total_spend)}
                    </td>
                    <td className="py-2.5 text-right tabular-nums text-muted">
                      {formatDate(row.last_order_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ReportSection>

      <p className="mt-10 text-xs text-muted">
        Exports are CSV, which opens in Excel, Numbers and Google Sheets. For a
        PDF, use your browser&rsquo;s Print &rarr; Save as PDF — it prints the
        tables above without the navigation.
      </p>
    </div>
  );
}

/**
 * One report block. Extracted because five of them in a row is exactly where a
 * page drifts — different heading sizes, different gaps, an export button in a
 * different corner each time.
 */
function ReportSection({
  id,
  title,
  description,
  action,
  children,
}: {
  id: string;
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={`${id}-heading`} className="mt-10">
      <CheckerBand size="sm" className="mb-5 h-1.5 opacity-70" />

      <div className="mb-5 flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div>
          <h2 id={`${id}-heading`} className="text-xl font-semibold tracking-tight text-ink">
            {title}
          </h2>
          <p className="mt-1 max-w-[62ch] text-sm text-muted">{description}</p>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>

      {children}
    </section>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { toCsv, downloadCsv, datedFilename, type CsvColumn } from "@/lib/csv";
import { formatDate } from "@/lib/format";
import { formatHour } from "@/lib/order-meta";
import type {
  PeakHourRow,
  PopularItemRow,
  PromoPerformance,
  SalesReportRow,
  TopCustomerRow,
} from "@/types/database";

/**
 * CSV export.
 *
 * The data is already on the client — every report renders it as a table — so
 * the export is a pure client-side transform with no second round trip and no
 * API route that could disagree with what is on screen. What you download is
 * literally what you are looking at.
 *
 * Money is exported as a bare number, not a formatted "₱1,234.00" string.
 * A spreadsheet can format a number; it cannot sum a string, and the whole
 * point of exporting is to do arithmetic somewhere else.
 */
type Exportable =
  | { kind: "sales"; rows: SalesReportRow[]; grain: "day" | "month" | "year" }
  | { kind: "hours"; rows: PeakHourRow[] }
  | { kind: "items"; rows: PopularItemRow[] }
  | { kind: "customers"; rows: TopCustomerRow[] }
  | { kind: "promos"; rows: PromoPerformance[] };

const COLUMNS: {
  [K in Exportable["kind"]]: (
    data: Extract<Exportable, { kind: K }>
  ) => CsvColumn<never>[];
} = {
  sales: (d) =>
    [
      {
        header: "Period",
        value: (r: SalesReportRow) =>
          d.grain === "day"
            ? formatDate(r.period)
            : new Date(r.period).toISOString().slice(0, 10),
      },
      { header: "Orders", value: (r: SalesReportRow) => r.order_count },
      { header: "Gross", value: (r: SalesReportRow) => r.gross_amount },
      { header: "Discounts", value: (r: SalesReportRow) => r.discount_amount },
      { header: "Net", value: (r: SalesReportRow) => r.net_amount },
      { header: "Average order", value: (r: SalesReportRow) => r.average_order_value },
    ] as CsvColumn<never>[],

  hours: () =>
    [
      { header: "Hour", value: (r: PeakHourRow) => formatHour(r.hour_of_day) },
      { header: "Orders", value: (r: PeakHourRow) => r.order_count },
      { header: "Revenue", value: (r: PeakHourRow) => r.revenue },
    ] as CsvColumn<never>[],

  items: () =>
    [
      { header: "Item", value: (r: PopularItemRow) => r.item_name },
      { header: "Flavor", value: (r: PopularItemRow) => r.flavor },
      { header: "Units sold", value: (r: PopularItemRow) => r.total_quantity },
      { header: "Orders", value: (r: PopularItemRow) => r.order_count },
      { header: "Revenue", value: (r: PopularItemRow) => r.total_revenue },
    ] as CsvColumn<never>[],

  customers: () =>
    [
      { header: "Customer", value: (r: TopCustomerRow) => r.full_name ?? "Unnamed" },
      { header: "Phone", value: (r: TopCustomerRow) => r.phone ?? "" },
      { header: "Orders", value: (r: TopCustomerRow) => r.order_count },
      { header: "Total spend", value: (r: TopCustomerRow) => r.total_spend },
      { header: "Last order", value: (r: TopCustomerRow) => formatDate(r.last_order_at) },
    ] as CsvColumn<never>[],

  promos: () =>
    [
      { header: "Code", value: (r: PromoPerformance) => r.code },
      { header: "Description", value: (r: PromoPerformance) => r.description ?? "" },
      {
        header: "Discount",
        value: (r: PromoPerformance) =>
          r.discount_type === "percent"
            ? `${r.discount_value}%`
            : String(r.discount_value),
      },
      { header: "Active", value: (r: PromoPerformance) => (r.is_active ? "Yes" : "No") },
      { header: "Redemptions", value: (r: PromoPerformance) => r.redemptions },
      { header: "Discount given", value: (r: PromoPerformance) => r.discount_given },
      {
        header: "Revenue influenced",
        value: (r: PromoPerformance) => r.revenue_influenced,
      },
    ] as CsvColumn<never>[],
};

export function ExportButton({
  data,
  label = "Export CSV",
}: {
  data: Exportable;
  label?: string;
}) {
  const rows = data.rows as never[];
  const disabled = rows.length === 0;

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={disabled}
      // Titled rather than hidden when empty: a button that vanishes leaves
      // someone hunting for a feature they remember being there.
      title={disabled ? "Nothing to export in this range" : undefined}
      onClick={() => {
        const columns = COLUMNS[data.kind](
          data as Extract<Exportable, { kind: typeof data.kind }> & never
        );
        downloadCsv(datedFilename(data.kind), toCsv(rows, columns));
      }}
    >
      <svg
        viewBox="0 0 16 16"
        className="h-3.5 w-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        aria-hidden="true"
      >
        <path d="M8 2v8m0 0L5 7m3 3l3-3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2.5 11.5v1a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-1" strokeLinecap="round" />
      </svg>
      {label}
    </Button>
  );
}

"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatPrice, formatDate } from "@/lib/format";
import { formatHour } from "@/lib/order-meta";
import { useTokenColors } from "@/lib/use-token-colors";
import type { PeakHourRow, SalesReportRow } from "@/types/database";

/**
 * Report charts.
 *
 * Two conventions carried over from `best-seller-chart.tsx`, both load-bearing:
 *
 *   1. TOKENS ARE READ, NOT HARDCODED. Recharts writes `fill` as an SVG
 *      attribute, and an attribute cannot hold `var(--token)` — so the values
 *      are resolved off the document at runtime. That is what keeps a chart
 *      correct in dark mode without a second palette to maintain. The literals
 *      below are only the server-render fallback, and they are the light
 *      theme's actual values.
 *
 *   2. THE CHART IS aria-hidden AND A REAL TABLE SITS BESIDE IT. A chart is
 *      not describable in an alt attribute; the honest alternative is the same
 *      numbers in a form a screen reader can navigate. Two representations,
 *      one of them exposed — not a picture with a caption that lies about it.
 */
const TOKENS = {
  "--hi-accent": "#c87137",
  "--hi-secondary": "#2d5016",
  "--hi-line": "#ded0b6",
  "--hi-muted": "#6d6152",
  "--hi-ink": "#1a1a1a",
  "--hi-ink-soft": "#3d352c",
  "--hi-raised": "#ece0c6",
  "--hi-card": "#fffdf9",
};

function EmptyChart({ message }: { message: string }) {
  return (
    <p className="rounded-lg border border-dashed border-line-strong bg-card px-6 py-12 text-center text-sm text-muted">
      {message}
    </p>
  );
}

/* ==========================================================================
   Sales over time
   ========================================================================== */

export function SalesChart({
  data,
  grain,
}: {
  data: SalesReportRow[];
  grain: "day" | "month" | "year";
}) {
  const c = useTokenColors(TOKENS);

  if (data.length === 0) {
    return <EmptyChart message="No completed orders in this range yet." />;
  }

  const label = (period: string) => {
    const d = new Date(period);
    if (grain === "year") return String(d.getFullYear());
    if (grain === "month")
      return d.toLocaleDateString("en-PH", { month: "short", year: "2-digit" });
    return d.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
  };

  const chartData = data.map((row) => ({ ...row, label: label(row.period) }));
  const total = data.reduce((sum, r) => sum + r.net_amount, 0);
  const orders = data.reduce((sum, r) => sum + r.order_count, 0);

  return (
    <div>
      <div aria-hidden="true" className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
          >
            <CartesianGrid vertical={false} stroke={c["--hi-line"]} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: c["--hi-muted"] }}
              axisLine={{ stroke: c["--hi-line"] }}
              tickLine={false}
              // A month of daily bars will not fit 30 labels; Recharts drops
              // every other one rather than overlapping them.
              interval="preserveStartEnd"
              minTickGap={16}
            />
            <YAxis
              tick={{ fontSize: 11, fill: c["--hi-muted"] }}
              axisLine={false}
              tickLine={false}
              width={64}
              tickFormatter={(v: number) => `₱${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`}
            />
            <Tooltip
              cursor={{ fill: c["--hi-raised"] }}
              formatter={(value) => [formatPrice(Number(value)), "Net revenue"]}
              labelStyle={{ color: c["--hi-ink"], fontWeight: 600 }}
              contentStyle={{
                borderRadius: 8,
                border: `1px solid ${c["--hi-line"]}`,
                background: c["--hi-card"],
                color: c["--hi-ink"],
                fontSize: 12,
              }}
            />
            <Bar
              dataKey="net_amount"
              fill={c["--hi-accent"]}
              radius={[4, 4, 0, 0]}
              maxBarSize={44}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[34rem] text-left text-sm">
          <caption className="sr-only">
            Revenue per period, with order count and average order value.
          </caption>
          <thead>
            <tr className="border-b border-line eyebrow text-muted">
              <th scope="col" className="py-2 pr-4 font-medium">Period</th>
              <th scope="col" className="py-2 pr-4 text-right font-medium">Orders</th>
              <th scope="col" className="py-2 pr-4 text-right font-medium">Gross</th>
              <th scope="col" className="py-2 pr-4 text-right font-medium">Discounts</th>
              <th scope="col" className="py-2 pr-4 text-right font-medium">Net</th>
              <th scope="col" className="py-2 text-right font-medium">Avg order</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.period} className="border-b border-line last:border-0">
                <th scope="row" className="whitespace-nowrap py-2.5 pr-4 text-left font-medium text-ink">
                  {grain === "day" ? formatDate(row.period) : label(row.period)}
                </th>
                <td className="py-2.5 pr-4 text-right numeric text-ink-soft">{row.order_count}</td>
                <td className="py-2.5 pr-4 text-right numeric text-ink-soft">{formatPrice(row.gross_amount)}</td>
                <td className="py-2.5 pr-4 text-right numeric text-muted">
                  {row.discount_amount > 0 ? `−${formatPrice(row.discount_amount)}` : "—"}
                </td>
                <td className="py-2.5 pr-4 text-right font-semibold numeric text-ink">{formatPrice(row.net_amount)}</td>
                <td className="py-2.5 text-right numeric text-ink-soft">{formatPrice(row.average_order_value)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-line-strong">
              <th scope="row" className="py-2.5 pr-4 text-left font-semibold text-ink">Total</th>
              <td className="py-2.5 pr-4 text-right font-semibold numeric text-ink">{orders}</td>
              <td colSpan={2} />
              <td className="py-2.5 pr-4 text-right font-semibold numeric text-ink">{formatPrice(total)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

/* ==========================================================================
   Peak hours
   ========================================================================== */

export function PeakHoursChart({ data }: { data: PeakHourRow[] }) {
  const c = useTokenColors(TOKENS);

  const busiest = data.reduce<PeakHourRow | null>(
    (best, row) => (!best || row.order_count > best.order_count ? row : best),
    null
  );

  if (!busiest || busiest.order_count === 0) {
    return <EmptyChart message="No completed orders yet, so there is no pattern to show." />;
  }

  const chartData = data.map((row) => ({ ...row, label: formatHour(row.hour_of_day) }));

  // Only the hours that saw an order are worth tabulating; all 24 stay in the
  // chart so the quiet ones read as quiet rather than missing.
  const active = data.filter((row) => row.order_count > 0);

  return (
    <div>
      <p className="mb-4 text-sm text-ink-soft">
        Busiest hour is{" "}
        <span className="font-semibold text-ink">{formatHour(busiest.hour_of_day)}</span>,
        with {busiest.order_count} {busiest.order_count === 1 ? "order" : "orders"}.
      </p>

      <div aria-hidden="true" className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
            <CartesianGrid vertical={false} stroke={c["--hi-line"]} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: c["--hi-muted"] }}
              axisLine={{ stroke: c["--hi-line"] }}
              tickLine={false}
              interval={2}
            />
            <YAxis
              tick={{ fontSize: 11, fill: c["--hi-muted"] }}
              axisLine={false}
              tickLine={false}
              width={32}
              allowDecimals={false}
            />
            <Tooltip
              cursor={{ fill: c["--hi-raised"] }}
              formatter={(value) => [`${Number(value)} orders`, "Volume"]}
              labelStyle={{ color: c["--hi-ink"], fontWeight: 600 }}
              contentStyle={{
                borderRadius: 8,
                border: `1px solid ${c["--hi-line"]}`,
                background: c["--hi-card"],
                color: c["--hi-ink"],
                fontSize: 12,
              }}
            />
            {/* Green here, not orange: this chart sits directly under the
                revenue chart, and two adjacent orange series read as one
                continuous dataset. */}
            <Bar
              dataKey="order_count"
              fill={c["--hi-secondary"]}
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[24rem] text-left text-sm">
          <caption className="sr-only">Orders and revenue by hour of day.</caption>
          <thead>
            <tr className="border-b border-line eyebrow text-muted">
              <th scope="col" className="py-2 pr-4 font-medium">Hour</th>
              <th scope="col" className="py-2 pr-4 text-right font-medium">Orders</th>
              <th scope="col" className="py-2 text-right font-medium">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {active.map((row) => (
              <tr key={row.hour_of_day} className="border-b border-line last:border-0">
                <th scope="row" className="py-2.5 pr-4 text-left font-medium text-ink">
                  {formatHour(row.hour_of_day)}
                </th>
                <td className="py-2.5 pr-4 text-right numeric text-ink-soft">{row.order_count}</td>
                <td className="py-2.5 text-right numeric text-ink-soft">{formatPrice(row.revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

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
import { formatPrice } from "@/lib/format";
import { useTokenColors } from "@/lib/use-token-colors";
import type { BestSellingFlavor } from "@/types/database";

/** Token names, with their light-theme values as the SSR fallback. */
const TOKENS = {
  "--hi-accent": "#6f4e37",
  "--hi-line": "#d6d3d1",
  "--hi-muted": "#736c67",
  "--hi-ink": "#1c1917",
  "--hi-ink-soft": "#44403c",
  "--hi-raised": "#f5f5f4",
  "--hi-card": "#ffffff",
};

/** Row height that keeps bars readable as the flavour list grows. */
const ROW_HEIGHT = 44;
const MIN_HEIGHT = 240;

export function BestSellerChart({ data }: { data: BestSellingFlavor[] }) {
  const c = useTokenColors(TOKENS);

  if (data.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-line-strong bg-card px-6 py-12 text-center text-sm text-muted">
        No completed orders in this range yet.
      </p>
    );
  }

  // Recharts draws a vertical bar chart bottom-up, so ascending order here
  // puts the best seller at the top of the rendered axis.
  const chartData = [...data].sort((a, b) => a.total_quantity - b.total_quantity);
  const ranked = [...data].sort((a, b) => b.total_quantity - a.total_quantity);

  return (
    <div>
      {/* aria-hidden on the chart, because the table below is the same data in
          a form a screen reader can actually navigate. Two representations,
          one of them exposed — not a chart with an alt text that lies. */}
      <div
        aria-hidden="true"
        style={{ height: Math.max(MIN_HEIGHT, chartData.length * ROW_HEIGHT) }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 8, right: 24, bottom: 8, left: 8 }}
            barCategoryGap={10}
          >
            <CartesianGrid horizontal={false} stroke={c["--hi-line"]} />
            <XAxis
              type="number"
              tick={{ fontSize: 12, fill: c["--hi-muted"] }}
              axisLine={{ stroke: c["--hi-line"] }}
              tickLine={false}
              allowDecimals={false}
            />
            <YAxis
              type="category"
              dataKey="flavor"
              width={110}
              tick={{ fontSize: 12, fill: c["--hi-ink-soft"] }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: c["--hi-raised"] }}
              formatter={(value) => [`${value} sold`, "Quantity"]}
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
              dataKey="total_quantity"
              fill={c["--hi-accent"]}
              radius={[0, 4, 4, 0]}
              maxBarSize={22}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[30rem] text-left text-sm">
          <caption className="sr-only">
            Flavours by units sold, with order count and revenue.
          </caption>
          <thead>
            <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
              <th scope="col" className="py-2 pr-4 font-medium">Flavor</th>
              <th scope="col" className="py-2 pr-4 font-medium">Units sold</th>
              <th scope="col" className="py-2 pr-4 font-medium">Orders</th>
              <th scope="col" className="py-2 font-medium">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((row, i) => (
              <tr key={row.flavor} className="border-b border-line last:border-0">
                {/* scope="row" ties every figure in the row to its flavour */}
                <th scope="row" className="whitespace-nowrap py-2.5 pr-4 text-left font-medium text-ink">
                  {row.flavor}
                  {i === 0 && (
                    <span className="ml-2 rounded-full bg-accent-soft px-2 py-0.5 text-2xs font-semibold uppercase tracking-wide text-accent">
                      Top
                    </span>
                  )}
                </th>
                <td className="whitespace-nowrap py-2.5 pr-4 tabular-nums text-ink-soft">{row.total_quantity}</td>
                <td className="whitespace-nowrap py-2.5 pr-4 tabular-nums text-ink-soft">{row.order_count}</td>
                <td className="whitespace-nowrap py-2.5 tabular-nums text-ink-soft">{formatPrice(row.total_revenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

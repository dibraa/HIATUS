"use client";
import { useState } from "react";
import { SelectField } from "@/components/ui/field";
import type { ActivityMetrics } from "@/lib/activity";
export function PeriodSummary({ data }: { data: Pick<ActivityMetrics, "daily" | "weekly" | "monthly"> }) {
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("daily");
  return <section className="admin-panel">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-4"><h2 className="text-lg font-semibold">Activity over time</h2><SelectField id="summary-period" label="Group records" value={period} onChange={event => setPeriod(event.target.value as typeof period)}><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></SelectField></div>
    <p className="mb-4 text-xs text-muted">Buckets show only records within the selected dates. Weeks begin Monday. Dates use Asia/Manila.</p>
    <div className="admin-table-scroll" tabIndex={0} role="region" aria-label="Activity over time table"><table className="w-full min-w-[28rem] text-left text-sm">
      <thead><tr className="border-b border-line text-xs text-muted">{["Period beginning", "Recorded actions", "Success", "Failure"].map(label => <th key={label} scope="col" className="px-2 py-3 font-medium">{label}</th>)}</tr></thead>
      <tbody className="divide-y divide-line">{data[period].length === 0 ? <tr><td colSpan={4} className="py-8 text-center text-muted">No staff activity recorded in this period.</td></tr> : data[period].map(row => <tr key={row.period}><th scope="row" className="px-2 py-3 font-medium">{row.period}</th><td className="px-2 py-3 tabular-nums">{row.count}</td><td className="px-2 py-3 tabular-nums">{row.success}</td><td className="px-2 py-3 tabular-nums">{row.failure}</td></tr>)}</tbody>
    </table></div>
  </section>;
}

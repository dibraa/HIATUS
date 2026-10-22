import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin-page-header";
import { AdminStatCard } from "@/components/admin-stat-card";
import { ActivityFilters } from "@/components/admin-activity-filters";
import { DataError } from "@/components/ui/data-error";
import { Badge } from "@/components/ui/badge";
import { apiJson } from "@/lib/api-client";
import { getServerToken } from "@/lib/server-token";
import { formatDateTime } from "@/lib/format";
import { activityQuery, actionLabel, type ActivityMetrics, type ActivityOptions, type AdminSearch } from "@/lib/activity";
import { PeriodSummary } from "./period-summary";
export const metadata: Metadata = { title: "Staff activity metrics" };
export const dynamic = "force-dynamic";

export default async function PerformancePage({ searchParams }: { searchParams: Promise<AdminSearch> }) {
  const query = activityQuery(await searchParams, true);
  const token = (await getServerToken()) || undefined;
  let data: ActivityMetrics, options: ActivityOptions;
  try {
    [data, options] = await Promise.all([
      apiJson<ActivityMetrics>(`/activity/metrics?${query}`, { token, cache: "no-store" }),
      apiJson<ActivityOptions>("/activity/options", { token, cache: "no-store" }),
    ]);
  } catch (error) { return <><AdminPageHeader title="Staff activity metrics" /><DataError title="Could not load activity metrics" body={(error as Error).message} showRetry /><a href="/admin/performance" className="admin-secondary-link mt-4">Reset filters</a></>; }
  return <div className="space-y-5">
    <AdminPageHeader title="Staff activity metrics" description="Recorded staff and administrator actions, not an employee performance score." />
    <ActivityFilters options={options} query={query} period={data.period} metrics />
    <p className="text-sm text-muted">Reporting period: {data.period.from} to {data.period.to} · Asia/Manila</p>
    <div className="admin-stats">
      <AdminStatCard label="Staff accounts" value={data.staff_count} hint="Current staff accounts, across all dates" />
      <AdminStatCard label="Recorded actions" value={data.totals.count} hint="Selected staff and reporting period" />
      <AdminStatCard label="Successful actions" value={data.totals.success} hint="Confirmed server results" />
      <AdminStatCard label="Failed actions" value={data.totals.failure} hint="Recorded failures in this period" />
    </div>
    <div className="grid gap-5 xl:grid-cols-2">
      {[{ title: "By staff member", rows: data.by_actor.map(row => ({ ...row, label: row.name })) }, { title: "By action", rows: data.by_action.map(row => ({ ...row, label: actionLabel(row._id) })) }].map(section => <section className="admin-panel" key={section.title}>
        <h2 className="mb-4 text-lg font-semibold">{section.title}</h2>
        <div className="admin-table-scroll" tabIndex={0} role="region" aria-label={`${section.title} table`}><table className="w-full min-w-[28rem] text-left text-sm">
          <thead><tr className="border-b border-line text-xs text-muted">{[section.title === "By action" ? "Action" : "Staff member", "Actions", "Success", "Failure"].map(label => <th key={label} scope="col" className="px-2 py-3 font-medium">{label}</th>)}</tr></thead>
          <tbody className="divide-y divide-line">{section.rows.length === 0 ? <tr><td colSpan={4} className="py-8 text-center text-muted">No recorded activity for this selection.</td></tr> : section.rows.map(row => <tr key={row._id}><th scope="row" className="px-2 py-3 font-medium">{row.label}</th><td className="px-2 py-3 tabular-nums">{row.count}</td><td className="px-2 py-3 tabular-nums">{row.success}</td><td className="px-2 py-3 tabular-nums">{row.failure}</td></tr>)}</tbody>
        </table></div>
      </section>)}
    </div>
    <PeriodSummary data={data} />
    <section className="admin-panel"><h2 className="mb-4 text-lg font-semibold">Recent staff activity</h2>
      {data.recent.length === 0 ? <p className="text-sm text-muted">No recent activity in this reporting period.</p> : <ul className="divide-y divide-line">{data.recent.map(log => <li key={log._id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="text-sm font-medium">{log.actor_name} · {actionLabel(log.action)}</p><p className="mt-1 text-xs text-muted">{formatDateTime(log.created_at)}</p></div><Badge tone={log.status === "success" ? "success" : "danger"}>{log.status === "success" ? "Success" : "Failure"}</Badge></li>)}</ul>}
    </section>
  </div>;
}

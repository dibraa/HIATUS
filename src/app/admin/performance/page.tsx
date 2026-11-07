import { activityToday, activityRangeDates, activityDateError, readActivityFilters } from "@/lib/activity-filters";
import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin-page-header";
import { AdminStatCard } from "@/components/admin-stat-card";
import { ActivityFilters } from "@/components/admin-activity-filters";
import { DataError } from "@/components/ui/data-error";
import { Badge } from "@/components/ui/badge";
import { apiJson } from "@/lib/api-client";
import { getServerToken } from "@/lib/server-token";
import { formatDateTime } from "@/lib/format";
import { activityQuery, activityDisplayQuery, actionLabel, type ActivityMetrics, type ActivityOptions, type AdminSearch } from "@/lib/activity";
import { PeriodSummary } from "./period-summary";
export const metadata: Metadata = { title: "Staff activity metrics" };
export const dynamic = "force-dynamic";

export default async function PerformancePage({ searchParams }: { searchParams: Promise<AdminSearch> }) {
  const search = await searchParams;
  const query = activityQuery(search,true);
  const displayQuery = activityDisplayQuery(search,true);
  const today = activityToday();
  const selected = readActivityFilters(displayQuery.toString(),today,true);
  const fallbackDates = activityDateError(selected.from,selected.to) ? activityRangeDates(today,"30d") : { from:selected.from, to:selected.to };
  const fallbackPeriod = {...fallbackDates,timezone:"Asia/Manila"};
  const token = (await getServerToken()) || undefined;
  const [records, choices] = await Promise.allSettled([
    apiJson<ActivityMetrics>(`/activity/metrics?${query}`, { token, cache: "no-store" }),
    apiJson<ActivityOptions>("/activity/options", { token, cache: "no-store" }),
  ]);
  const data = records.status === "fulfilled" ? records.value : null;
  const options = choices.status === "fulfilled" ? choices.value : { actors:[],actions:[] };
  const loadError = records.status === "rejected" ? (records.reason as Error).message : undefined;
  const choicesError = choices.status === "rejected" ? "Filter choices unavailable" : undefined;
  return <div className="space-y-5">
    <AdminPageHeader title="Staff activity metrics" description="Recorded actions, not a performance score." />
    <ActivityFilters options={options} query={displayQuery.toString()} period={data?.period || fallbackPeriod} today={today} choicesError={choicesError} metrics />
    {data ? <>
    <div className="admin-stats">
      <AdminStatCard label="Staff accounts" value={data.staff_count} hint="Across all dates" />
      <AdminStatCard label="Recorded actions" value={data.totals.count} />
      <AdminStatCard label="Successful actions" value={data.totals.success} />
      <AdminStatCard label="Failed actions" value={data.totals.failure} />
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
    </> : <DataError title="Could not load activity metrics" body={loadError || "Try again shortly."} showRetry />}
  </div>;
}

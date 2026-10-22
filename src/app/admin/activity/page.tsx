import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin-page-header";
import { ActivityFilters } from "@/components/admin-activity-filters";
import { AdminPagination } from "@/components/admin-pagination";
import { Badge } from "@/components/ui/badge";
import { DataError } from "@/components/ui/data-error";
import { apiJson } from "@/lib/api-client";
import { getServerToken } from "@/lib/server-token";
import { formatDateTime } from "@/lib/format";
import { activityQuery, actionLabel, type ActivityList, type ActivityOptions, type AdminSearch } from "@/lib/activity";
export const metadata: Metadata = { title: "Activity logs" };
export const dynamic = "force-dynamic";

export default async function ActivityPage({ searchParams }: { searchParams: Promise<AdminSearch> }) {
  const query = activityQuery(await searchParams);
  const token = (await getServerToken()) || undefined;
  let data: ActivityList, options: ActivityOptions;
  try {
    [data, options] = await Promise.all([
      apiJson<ActivityList>(`/activity?${query}`, { token, cache: "no-store" }),
      apiJson<ActivityOptions>("/activity/options", { token, cache: "no-store" }),
    ]);
  } catch (error) {
    return <><AdminPageHeader title="Activity logs" /><DataError title="Could not load activity" body={(error as Error).message} showRetry /><a href="/admin/activity" className="admin-secondary-link mt-4">Reset filters</a></>;
  }
  return <div>
    <AdminPageHeader title="Activity logs" description="Account, menu, and counter actions recorded by the server. Logs cannot be edited here." />
    <ActivityFilters options={options} query={query} period={data.period} />
    <section className="admin-panel" aria-label="Activity records">
      <p className="mb-4 text-sm text-muted">{data.period.from} to {data.period.to} · Asia/Manila</p>
      <div className="admin-table-scroll" tabIndex={0} role="region" aria-label="Activity log table">
        <table className="relative w-full min-w-[48rem] text-left text-sm">
          <caption className="sr-only">Time, actor, action, affected record, and result.</caption>
          <thead><tr className="border-b border-line text-xs text-muted">{["Date and time", "Account", "Action", "Record", "Result"].map(label => <th key={label} scope="col" className="px-2 py-3 font-medium">{label}</th>)}</tr></thead>
          <tbody className="divide-y divide-line">
            {data.items.length === 0 ? <tr><td colSpan={5} className="px-2 py-10 text-center text-muted">No activity matches this period and these filters.</td></tr>
              : data.items.map(log => <tr key={log._id}>
                <td className="whitespace-nowrap px-2 py-4 text-ink-soft">{formatDateTime(log.created_at)}</td>
                <th scope="row" className="px-2 py-4 font-medium text-ink">{log.actor_name}<span className="mt-1 block text-xs font-normal text-muted">{log.actor_role}</span></th>
                <td className="px-2 py-4 text-ink-soft">{actionLabel(log.action)}{Boolean(log.details?.fields?.length) && <span className="mt-1 block text-xs text-muted">Fields: {log.details?.fields?.join(", ")}</span>}</td>
                <td className="px-2 py-4 text-ink-soft">{log.resource_type}<span className="mt-1 block max-w-48 break-all text-xs text-muted">{log.resource_id || "No specific record"}</span></td>
                <td className="px-2 py-4"><Badge tone={log.status === "success" ? "success" : "danger"}>{log.status === "success" ? "Success" : "Failure"}</Badge></td>
              </tr>)}
          </tbody>
        </table>
      </div>
      <AdminPagination path="/admin/activity" query={query} page={data.page} pageSize={data.page_size} total={data.total} />
    </section>
  </div>;
}

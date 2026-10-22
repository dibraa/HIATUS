import Link from "next/link";
import { SelectField, TextField } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import type { ActivityOptions, ReportingPeriod } from "@/lib/activity";
import { actionLabel } from "@/lib/activity";

export function ActivityFilters({ options, query, period, metrics = false }: {
  options: ActivityOptions; query: URLSearchParams; period: ReportingPeriod; metrics?: boolean;
}) {
  const path = metrics ? "/admin/performance" : "/admin/activity";
  return <form action={path} className="admin-panel mb-5" aria-label="Activity filters">
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <SelectField id="activity-staff" name="staff" label="Staff member" defaultValue={query.get("staff") || ""}>
        <option value="">{metrics ? "All staff and administrators" : "All accounts and attempts"}</option>
        {options.actors.map(actor => <option key={actor.id} value={actor.id}>{actor.name}</option>)}
      </SelectField>
      <TextField id="activity-from" name="from" label="From date" type="date" defaultValue={query.get("from") || period.from} required />
      <TextField id="activity-to" name="to" label="To date" type="date" defaultValue={query.get("to") || period.to} required />
      {!metrics && <>
        <TextField id="activity-search" name="search" label="Search activity" type="search" maxLength={100} placeholder="Name, action, or record ID" defaultValue={query.get("search") || ""} />
        <SelectField id="activity-action" name="action" label="Action" defaultValue={query.get("action") || ""}>
          <option value="">All actions</option>{options.actions.map(action => <option key={action} value={action}>{actionLabel(action)}</option>)}
        </SelectField>
        <SelectField id="activity-status" name="status" label="Result" defaultValue={query.get("status") || ""}>
          <option value="">All results</option><option value="success">Success</option><option value="failure">Failure</option>
        </SelectField>
      </>}
    </div>
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <Button type="submit">Apply filters</Button>
      <Link href={path} className="admin-secondary-link">Reset</Link>
      <p className="text-xs text-muted">Dates use Asia/Manila. Maximum range: 366 days.</p>
    </div>
  </form>;
}

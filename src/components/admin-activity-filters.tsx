"use client";

import { useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SelectField, TextField } from "@/components/ui/field";
import type { ActivityOptions, ReportingPeriod } from "@/lib/activity";
import { actionLabel } from "@/lib/activity";

export function ActivityFilters({ options, query, period, metrics = false }: {
  options: ActivityOptions; query: URLSearchParams; period: ReportingPeriod; metrics?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchTimer = useRef<number | null>(null);
  const [values, setValues] = useState({
    staff: query.get("staff") || "",
    from: query.get("from") || period.from,
    to: query.get("to") || period.to,
    search: query.get("search") || "",
    action: query.get("action") || "",
    status: query.get("status") || "",
  });
  function apply(next: typeof values) {
    const params = new URLSearchParams();
    Object.entries(next).forEach(([key, value]) => { if (value) params.set(key, value); });
    router.push(`${pathname}${params.toString() ? `?${params}` : ""}`);
  }
  function update(key: keyof typeof values, value: string) {
    const next = { ...values, [key]: value };
    setValues(next);
    if (key === "search") {
      if (searchTimer.current) window.clearTimeout(searchTimer.current);
      searchTimer.current = window.setTimeout(() => apply(next), 350);
    } else apply(next);
  }
  return <form className="admin-panel mb-5" aria-label="Activity filters" onSubmit={event => event.preventDefault()}>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <SelectField id="activity-staff" name="staff" label="Staff member" value={values.staff} onChange={event => update("staff", event.target.value)}>
        <option value="">{metrics ? "All staff and administrators" : "All accounts and attempts"}</option>
        {options.actors.map(actor => <option key={actor.id} value={actor.id}>{actor.name}</option>)}
      </SelectField>
      <TextField id="activity-from" name="from" label="From date" type="date" value={values.from} onChange={event => update("from", event.target.value)} required />
      <TextField id="activity-to" name="to" label="To date" type="date" value={values.to} onChange={event => update("to", event.target.value)} required />
      {!metrics && <>
        <TextField id="activity-search" name="search" label="Search activity" type="search" maxLength={100} placeholder="Name, action, or record ID" value={values.search} onChange={event => update("search", event.target.value)} />
        <SelectField id="activity-action" name="action" label="Action" value={values.action} onChange={event => update("action", event.target.value)}>
          <option value="">All actions</option>{options.actions.map(action => <option key={action} value={action}>{actionLabel(action)}</option>)}
        </SelectField>
        <SelectField id="activity-status" name="status" label="Result" value={values.status} onChange={event => update("status", event.target.value)}>
          <option value="">All results</option><option value="success">Success</option><option value="failure">Failure</option>
        </SelectField>
      </>}
    </div>
    <p className="mt-4 text-xs text-muted">Dates use Asia/Manila. Maximum range: 366 days.</p>
  </form>;
}

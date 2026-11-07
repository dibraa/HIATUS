"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SelectField, TextField } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import type { ActivityOptions, ReportingPeriod } from "@/lib/activity";
import { actionLabel } from "@/lib/activity";
import { activityDateError, activityFilterQuery, activityPeriodLabel, activityQueryKey, activityRangeDates, createActivityScheduler, readActivityFilters, type ActivityFilterValues, type ActivityRange } from "@/lib/activity-filters";

type FilterState = { source: string; today: string; values: ActivityFilterValues; version: number; submittedVersion: number; requested: string | null; moreOpen: boolean; dateTouched: boolean; navigation: number };
export function ActivityFilters({ options, query, period, today, metrics = false, choicesError }: {
  options: ActivityOptions; query: string; period: ReportingPeriod; today: string; metrics?: boolean; choicesError?: string;
}) {
  const router = useRouter(), pathname = usePathname(), liveQuery = useSearchParams();
  const currentQuery = activityQueryKey(liveQuery?.toString() ?? query);
  const [pending,start] = useTransition();
  const [state,setState] = useState<FilterState>(() => {
    const values = readActivityFilters(currentQuery,today,metrics);
    return { source: currentQuery, today, values, version: 0, submittedVersion: 0, requested: null, moreOpen: Boolean(values.action || values.status), dateTouched: false, navigation: 0 };
  });
  // Incoming route data may finish while someone is still editing. Only the
  // latest submitted snapshot can replace that draft; external navigation resets it.
  if (state.source !== currentQuery || state.today !== today) {
    const external = state.requested === null || (new URLSearchParams(currentQuery).has("page") && new URLSearchParams(currentQuery).get("page") !== new URLSearchParams(state.source).get("page"));
    const latestResponse = state.requested === currentQuery;
    const incoming = readActivityFilters(currentQuery,today,metrics);
    setState({ ...state, source: currentQuery, today,
      values: external || latestResponse && state.version === state.submittedVersion ? incoming : state.values,
      requested: external || latestResponse ? null : state.requested,
      moreOpen: external ? state.moreOpen || Boolean(incoming.action || incoming.status) : state.moreOpen,
      navigation: state.navigation + (external ? 1 : 0),
    });
  }
  const draft = useRef(state), source = useRef(currentQuery);
  useEffect(() => { draft.current = state; source.current = currentQuery; }, [state,currentQuery]);
  const scheduler = useRef<ReturnType<typeof createActivityScheduler> | null>(null);
  useEffect(() => {
    const controller = createActivityScheduler(() => {
      const latest = draft.current;
      if (activityDateError(latest.values.from,latest.values.to)) { setState(previous => ({...previous,dateTouched:true})); return; }
      const query = activityFilterQuery(latest.values,metrics), key = activityQueryKey(query);
      if (key === source.current) return;
      setState(previous => ({...previous,requested:key,submittedVersion:latest.version}));
      start(() => router.replace(pathname + "?" + query,{scroll:false}));
    });
    scheduler.current = controller;
    const restore = () => {
      controller.cancel();
      const query = activityQueryKey(window.location.search);
      setState(previous => ({...previous,source:query,values:readActivityFilters(query,today,metrics),requested:null,version:previous.version+1,dateTouched:false}));
    };
    window.addEventListener("popstate",restore);
    return () => { controller.cancel(); window.removeEventListener("popstate",restore); };
  },[metrics,pathname,router,start,today]);
  useEffect(() => { scheduler.current?.cancel(); },[state.navigation]);

  function update(patch: Partial<ActivityFilterValues>, delay: number) {
    const next = {...draft.current,values:{...draft.current.values,...patch},version:draft.current.version+1,dateTouched:false};
    draft.current = next;
    setState(previous => ({...previous,values:next.values,version:next.version,dateTouched:false}));
    scheduler.current?.schedule(delay);
  }
  function clear() {
    scheduler.current?.cancel();
    const next = {...draft.current,values:readActivityFilters("",today,metrics),version:draft.current.version+1,requested:"",moreOpen:false,dateTouched:false};
    next.submittedVersion = next.version;
    draft.current = next; setState(next);
    start(() => router.replace(pathname,{scroll:false}));
  }
  const values = state.values, dateError = activityDateError(values.from,values.to);
  const applied = readActivityFilters(query,today,metrics);
  const advanced = Number(Boolean(applied.action)) + Number(Boolean(applied.status));
  const selectedMissing = values.staff && !options.actors.some(actor => actor.id === values.staff);
  const clearAvailable = Boolean(values.staff || values.search || values.action || values.status || values.range !== "30d" || currentQuery);
  return <form className="admin-panel admin-activity-filters mb-5" aria-label="Activity filters" onSubmit={event => { event.preventDefault(); scheduler.current?.schedule(0); }}>
    <div className="admin-activity-main" data-metrics={metrics || undefined}>
      {!metrics && <TextField id="activity-search" name="search" label="Search activity" type="search" maxLength={100} placeholder="Name, action, or record ID" value={values.search} onChange={event => update({search:event.target.value},350)} />}
      <SelectField id="activity-staff" name="staff" label="Staff / admin" value={values.staff} onChange={event => update({staff:event.target.value},0)}>
        <option value="">{metrics ? "All staff / admins" : "All activity"}</option>
        {selectedMissing && <option value={values.staff}>Selected staff / admin</option>}
        {options.actors.map(actor => <option key={actor.id} value={actor.id}>{actor.name}</option>)}
      </SelectField>
      <SelectField id="activity-period" name="range" label="Period" value={values.range} onChange={event => {
        const range = event.target.value as ActivityRange;
        update(range === "custom" ? {range} : {...activityRangeDates(today,range),range},0);
      }}><option value="today">Today</option><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option><option value="custom">Custom dates</option></SelectField>
    </div>
    {values.range === "custom" && <div className="admin-activity-dates">
      <TextField id="activity-from" name="from" label="From date" type="date" value={values.from} onChange={event => update({from:event.target.value},400)} onBlur={() => setState(previous => ({...previous,dateTouched:true}))} aria-describedby={dateError && state.dateTouched ? "activity-date-error" : undefined} aria-invalid={Boolean(dateError && state.dateTouched)} required />
      <TextField id="activity-to" name="to" label="To date" type="date" value={values.to} onChange={event => update({to:event.target.value},400)} onBlur={() => setState(previous => ({...previous,dateTouched:true}))} aria-describedby={dateError && state.dateTouched ? "activity-date-error" : undefined} aria-invalid={Boolean(dateError && state.dateTouched)} required />
    </div>}
    {dateError && state.dateTouched && <p id="activity-date-error" role="alert" className="mt-3 text-sm text-danger">{dateError}</p>}
    {!metrics && <details className="admin-activity-more" open={state.moreOpen} onToggle={event => { const open = event.currentTarget.open; setState(previous => previous.moreOpen === open ? previous : {...previous,moreOpen:open}); }}>
      <summary>More filters{advanced > 0 && <span className="ml-2 text-muted">({advanced})</span>}</summary>
      <div className="admin-activity-extra">
        <SelectField id="activity-action" name="action" label="Action" value={values.action} onChange={event => update({action:event.target.value},0)}>
          <option value="">All actions</option>
          {values.action && !options.actions.includes(values.action) && <option value={values.action}>{actionLabel(values.action)}</option>}
          {options.actions.map(action => <option key={action} value={action}>{actionLabel(action)}</option>)}
        </SelectField>
        <SelectField id="activity-status" name="status" label="Result" value={values.status} onChange={event => update({status:event.target.value},0)}><option value="">All results</option><option value="success">Success</option><option value="failure">Failure</option></SelectField>
      </div>
    </details>}
    {choicesError && <p role="status" className="mt-3 text-sm text-muted">Filter choices could not load. Your current selection is kept.</p>}
    <div className="admin-activity-footer">
      <p role="status" aria-live="polite" className="text-xs text-muted">{pending ? "Updating results..." : activityPeriodLabel(period.from,period.to)}</p>
      <Button type="button" variant="ghost" disabled={!clearAvailable && !pending} onClick={clear}>Clear filters</Button>
    </div>
  </form>;
}

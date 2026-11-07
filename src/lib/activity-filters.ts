export type ActivityRange = "today" | "7d" | "30d" | "custom";
export type ActivityFilterValues = { staff: string; from: string; to: string; search: string; action: string; status: string; range: ActivityRange };
export function activityToday(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en", { timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const part = (name: string) => parts.find(value => value.type === name)?.value;
  return part("year") + "-" + part("month") + "-" + part("day");
}
export function activityRangeDates(today: string, range: Exclude<ActivityRange, "custom">) {
  const first = new Date(today + "T00:00:00Z");
  first.setUTCDate(first.getUTCDate() - (range === "today" ? 0 : range === "7d" ? 6 : 29));
  return { from: first.toISOString().slice(0, 10), to: today };
}
export function activityDateError(from: string, to: string): string | null {
  if (!from || !to) return "Choose both dates to update results.";
  const valid = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value + "T00:00:00Z")) && new Date(value + "T00:00:00Z").toISOString().slice(0, 10) === value;
  if (!valid(from) || !valid(to)) return "Enter valid calendar dates.";
  const days = (Date.parse(to + "T00:00:00Z") - Date.parse(from + "T00:00:00Z")) / 86400000 + 1;
  if (days < 1) return "To date must be on or after From date.";
  return days > 366 ? "Choose a range of 366 days or fewer." : null;
}
export function readActivityFilters(query: string, today: string, metrics = false): ActivityFilterValues {
  const params = new URLSearchParams(query), defaults = activityRangeDates(today, "30d");
  const from = params.get("from") || defaults.from, to = params.get("to") || defaults.to;
  const preset = (["today", "7d", "30d"] as const).find(key => { const dates = activityRangeDates(today,key); return dates.from === from && dates.to === to; });
  return { from, to, staff: params.get("staff") || "", search: metrics ? "" : params.get("search") || "", action: metrics ? "" : params.get("action") || "", status: metrics ? "" : params.get("status") || "", range: params.get("range") === "custom" ? "custom" : preset || "custom" };
}
export function activityFilterQuery(values: ActivityFilterValues, metrics = false): string {
  const query = new URLSearchParams();
  for (const key of metrics ? ["staff", "from", "to"] as const : ["staff", "from", "to", "status", "action", "search"] as const) if (values[key]) query.set(key, values[key]);
  query.set("range",values.range);
  return query.toString();
}
export function activityQueryKey(query: string): string { const values = new URLSearchParams(query); values.sort(); return values.toString(); }
export function createActivityScheduler(read: () => void, clock = { set: (fn: () => void, delay: number) => setTimeout(fn,delay), clear: (timer: ReturnType<typeof setTimeout>) => clearTimeout(timer) }) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  function cancel() { if (timer !== undefined) { clock.clear(timer); timer = undefined; } }
  return { cancel, schedule(delay: number) { cancel(); if (!delay) read(); else timer = clock.set(() => { timer = undefined; read(); },delay); } };
}
export function activityPeriodLabel(from: string, to: string): string {
  const format = new Intl.DateTimeFormat("en-PH", { year: "numeric", month: "short", day: "numeric", timeZone: "Asia/Manila" });
  return format.format(new Date(from + "T00:00:00+08:00")) + " - " + format.format(new Date(to + "T00:00:00+08:00"));
}

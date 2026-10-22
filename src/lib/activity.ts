export type ActivityOptions = { actors: { id: string; name: string }[]; actions: string[] };
export type ReportingPeriod = { from: string; to: string; timezone: string };
export type ActivityEntry = {
  _id: string; actor_id: string | null; actor_name: string; actor_role: string;
  action: string; resource_type: string; resource_id: string | null;
  status: "success" | "failure"; http_status: number; created_at: string;
  details?: { fields?: string[]; role?: string; available?: boolean };
};
export type ActivityList = { items: ActivityEntry[]; total: number; page: number; page_size: number; period: ReportingPeriod };
export type ActivityCount = { count: number; success: number; failure: number };
export type ActivityMetrics = {
  staff_count: number; totals: ActivityCount; period: ReportingPeriod;
  by_actor: (ActivityCount & { _id: string; name: string })[];
  by_action: (ActivityCount & { _id: string })[];
  daily: (ActivityCount & { period: string })[];
  weekly: (ActivityCount & { period: string })[];
  monthly: (ActivityCount & { period: string })[];
  recent: ActivityEntry[];
};
export type AdminSearch = Record<string, string | string[] | undefined>;
export function activityQuery(search: AdminSearch, metrics = false) {
  const query = new URLSearchParams();
  const keys = metrics ? ["staff", "from", "to"] : ["staff", "from", "to", "status", "action", "search", "page"];
  for (const key of keys) if (typeof search[key] === "string" && search[key]) query.set(key, search[key]);
  return query;
}
export function actionLabel(value: string) { return value.replaceAll(".", " · ").replaceAll("-", " "); }

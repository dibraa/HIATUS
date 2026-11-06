export function required(path: string, method: string, role: string, body: Record<string, unknown> = {}): string[] {
  const write = !["GET", "HEAD"].includes(method);
  path = path.replace(/^\/api(?=\/)/, "").split("?")[0];
  if (path === "/auth/me" || path === "/admin/permissions") return [];
  if (path.startsWith("/admin/team")) {
    if (/permissions$/.test(path)) return ["users.view", "users.permissions"];
    if (!write) return ["users.view"];
    return ["users.view", /create$/.test(path)?"users.create":/role$|grant$/.test(path)?"users.roles":/active$/.test(path)?"users.status":"users.edit"];
  }
  if (path.startsWith("/admin/orders")) return ["orders.view", "orders.manage"];
  if (path.startsWith("/admin/finance")) {
    if (/export$/.test(path)) return ["reports.view", "reports.export", ...(["sales","customers"].includes(String(body.view || "sales")) ? [] : ["finance.view"])];
    if (/customers/.test(path)) return ["reports.view"];
    return ["reports.view", "finance.view", ...(write ? [/reconciliation/.test(path)?"finance.reconcile":/refund$/.test(path)?"finance.refund":"finance.disputes"] : [])];
  }
  if (path.startsWith("/activity")) return [path === "/activity/metrics" || path === "/activity/options" ? "activity.view|performance.view|dashboard.view" : "activity.view"];
  if (path.startsWith("/analytics")) return path === "/analytics/today" ? [role === "admin" ? "dashboard.view" : "counter.view"] : ["reports.view|dashboard.view", ...(/xlsx$/.test(path)?["reports.export"]:[])];
  if (path.startsWith("/settings") && write) return ["settings.view", /credentials|integrations|authentication|receipts/.test(path)?"settings.integrations":"settings.edit"];
  if (/^\/settings\/(credentials|integrations|authentication|receipts)$/.test(path) || path.startsWith("/settings/credentials/")) return ["settings.view"];
  if (path.startsWith("/menu")) {
    if (!write) return /archived/.test(path) || body.paginated === "true" ? ["menu.view"] : [];
    if (method === "PUT" && "is_available" in body && Object.keys(body).length > 1) return ["menu.view", "menu.edit", "menu.availability"];
    return ["menu.view", /archive$|restore$/.test(path)?"menu.archive":/categories$/.test(path)?"menu.categories":Object.keys(body).length === 1 && "is_available" in body ? "menu.availability":"menu.edit"];
  }
  if (path.startsWith("/staff/menu")) return ["availability.view", "availability.edit"];
  if (path === "/staff/shifts") return [role === "admin" ? "users.view|performance.view" : "shift.view"];
  if (path.startsWith("/staff/")) return ["shift.view", ...(write?["shift.manage"]:[])];
  if (path.startsWith("/orders") && role !== "customer") {
    if (role === "admin") return [/^\/orders\/[^/]+(?:\/payments)?$/.test(path) ? "orders.view|finance.view" : "orders.view"];
    return ["counter.view", ...(write ? [/payment$/.test(path)?(body.kind === "refund"?"counter.refund":body.kind === "void"?"counter.void":"counter.payment"):/discount$/.test(path)?"counter.discount":"counter.prepare"] : [])];
  }
  return [];
}

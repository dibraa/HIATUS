import catalog from "./permission-catalog.json";
export { catalog };
export function defaultPermissions(role: string): string[] { return catalog.filter(p => p.role === role).map(p => p.key); }
export function pagePermission(path: string, view = ""): string[] {
  if (/^\/admin\/orders\/[^/]+\/receipt$/.test(path)) return ["orders.view|finance.view"];
  if (/^\/admin\/menu\/[^/]+$/.test(path)) return ["menu.view", "menu.edit"];
  if (path.startsWith("/staff/menu")) return ["availability.view"];
  if (path.startsWith("/staff/shift")) return ["shift.view"];
  if (path.startsWith("/staff")) return ["counter.view"];
  if (path.startsWith("/admin/reports")) return ["reports.view", ...(["transactions","refunds","reconciliation"].includes(view)?["finance.view"]:[])];
  const section = path.split("/")[2] || "dashboard";
  return [{dashboard:"dashboard.view",orders:"orders.view",menu:"menu.view",team:"users.view",activity:"activity.view",performance:"performance.view",settings:"settings.view"}[section] || "dashboard.view"];
}
export function firstAllowed(role: string, permissions: string[]): string {
  const paths = role === "admin" ? ["/admin", "/admin/orders", "/admin/menu", "/admin/reports", "/admin/team", "/admin/activity", "/admin/performance", "/admin/settings"] : role === "staff" ? ["/staff", "/staff/menu", "/staff/shift"] : ["/"];
  return paths.find(path => pagePermission(path).every(key => permissions.includes(key))) || "/access-denied";
}

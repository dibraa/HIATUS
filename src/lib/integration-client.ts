import type { BrowserIntegrations } from "./integrations";
let policy: BrowserIntegrations | null = null;
export function currentIntegrations() { return policy; }
export function setIntegrations(next: BrowserIntegrations | null) { policy = next; window.dispatchEvent(new Event("hiatus:integrations")); }
export function trackEvent(event: "menu_viewed" | "item_viewed" | "cart_added" | "checkout_started", properties: { item_id?: string; quantity?: number } = {}) {
  if (!policy?.posthog_enabled || navigator.doNotTrack === "1" || (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl) return;
  try {
    let id = sessionStorage.getItem("hiatus-analytics-id");
    if (!id) { id = crypto.randomUUID(); sessionStorage.setItem("hiatus-analytics-id", id); }
    void fetch("/api/integrations/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ event, anonymous_id: id, ...properties }) }).catch(() => {});
  } catch { /* Analytics never blocks shopping. */ }
}
export function reportBrowserError(error: unknown) {
  if (!policy?.sentry_enabled) return;
  const name = error instanceof Error ? error.name : "Error";
  const frames = error instanceof Error ? String(error.stack || "").split("\n").slice(1, 9).flatMap(line => {
    const match = line.match(/(?:https?:\/\/[^\s]+\/)([^/?#():]+\.js)(?:\?[^:)]*)?:(\d+):(\d+)/);
    return match ? [{ filename: match[1].replace(/[^a-zA-Z0-9_.-]/g, ""), lineno: Number(match[2]), colno: Number(match[3]) }] : [];
  }) : [];
  void fetch("/api/integrations/errors", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, frames }) }).catch(() => {});
}

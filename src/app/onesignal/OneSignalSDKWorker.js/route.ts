import { apiJson } from "@/lib/api-client";
import type { BrowserIntegrations } from "@/lib/integrations";
export async function GET() {
  let enabled = false;
  try { enabled = Boolean((await apiJson<BrowserIntegrations>("/integrations/options", { cache: "no-store" })).onesignal_app_id); } catch {}
  return new Response(enabled ? 'importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");' : 'self.addEventListener("activate", event => event.waitUntil(self.registration.unregister()));', { headers: { "Content-Type": "application/javascript", "Cache-Control": "no-store", "Service-Worker-Allowed": "/onesignal/" } });
}

"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { reportBrowserError, setIntegrations, trackEvent } from "@/lib/integration-client";
import { enableOneSignal, ONE_SIGNAL_DEVICE_KEY, stopOneSignal } from "@/lib/onesignal-client";
import type { BrowserIntegrations } from "@/lib/integrations";
export function IntegrationRuntime() {
  const pathname = usePathname(), tracked = useRef("");
  useEffect(() => {
    let disposed = false, controller: AbortController | null = null;
    const refresh = async () => {
      controller?.abort(); const request = new AbortController(); controller = request;
      try {
        const result = await fetch("/api/integrations/options", { cache: "no-store", signal: request.signal });
        if (!result.ok) throw new Error();
        const options = await result.json() as BrowserIntegrations;
        if (disposed) return;
        setIntegrations(options);
        if (!options.onesignal_app_id) stopOneSignal();
        else if (localStorage.getItem(ONE_SIGNAL_DEVICE_KEY) === "on") void enableOneSignal().catch(() => stopOneSignal());
        if (options.posthog_enabled && tracked.current !== pathname) {
          if (pathname === "/menu") trackEvent("menu_viewed");
          else if (/^\/menu\/[a-f0-9]{24}$/.test(pathname)) trackEvent("item_viewed", { item_id: pathname.split("/")[2] });
          else if (pathname === "/checkout") trackEvent("checkout_started");
          tracked.current = pathname;
        }
      } catch { if (!disposed && !request.signal.aborted) { setIntegrations(null); stopOneSignal(); } }
    };
    const handleError = (event: ErrorEvent) => reportBrowserError(event.error);
    const handleRejection = (event: PromiseRejectionEvent) => reportBrowserError(event.reason);
    const visibility = () => { if (document.visibilityState === "visible") void refresh(); };
    void refresh(); const timer = setInterval(refresh, 15000);
    window.addEventListener("focus", refresh); document.addEventListener("visibilitychange", visibility);
    window.addEventListener("error", handleError); window.addEventListener("unhandledrejection", handleRejection);
    return () => { disposed = true; controller?.abort(); clearInterval(timer); window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", visibility); window.removeEventListener("error", handleError); window.removeEventListener("unhandledrejection", handleRejection); };
  }, [pathname]);
  return null;
}

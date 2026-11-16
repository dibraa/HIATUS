"use client";
import { useEffect, useState } from "react";
import { enableOneSignal, ONE_SIGNAL_DEVICE_KEY, stopOneSignal } from "@/lib/onesignal-client";
import { Button } from "@/components/ui/button";
import { FormError, FormSuccess } from "@/components/ui/field";
export function OneSignalToggle() {
  const [on, setOn] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState<string | null>(null), [notice, setNotice] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    const sync = () => { if (localStorage.getItem(ONE_SIGNAL_DEVICE_KEY) === "on") void enableOneSignal().then(sdk => { if (!cancelled) { setOn(sdk.User.PushSubscription.optedIn); setError(null); } }).catch(error => { if (!cancelled) { setOn(false); setError(error instanceof Error ? error.message : "Push configuration changed. Reload this page."); } }); };
    sync(); window.addEventListener("hiatus:integrations", sync);
    return () => { cancelled = true; window.removeEventListener("hiatus:integrations", sync); };
  }, []);
  async function toggle() {
    setBusy(true); setError(null); setNotice(null);
    try {
      const sdk = await enableOneSignal();
      if (on) { await sdk.User.PushSubscription.optOut(); await sdk.logout(); stopOneSignal(); localStorage.removeItem(ONE_SIGNAL_DEVICE_KEY); setOn(false); setNotice("Notifications are off for this device."); }
      else { const allowed = await sdk.Notifications.requestPermission(); if (!allowed) throw new Error("Allow notifications in your browser settings, then try again."); await sdk.User.PushSubscription.optIn(); localStorage.setItem(ONE_SIGNAL_DEVICE_KEY, "on"); setOn(true); setNotice("Notifications are on for this device."); }
    } catch (error) { setError(error instanceof Error ? error.message : "Push notifications unavailable."); }
    finally { setBusy(false); }
  }
  return (
    <div className="rounded-xl border border-line bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-raised text-ink-soft" aria-hidden="true">
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M15 8a5 5 0 0 0-10 0c0 5-2 5-2 6.5h14C17 13 15 13 15 8ZM8 17h4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <div>
            <p className="text-sm font-semibold text-ink">Browser notifications</p>
            <p className="mt-0.5 text-xs text-muted">This device</p>
          </div>
        </div>
        {on && <span className="rounded-full bg-success-soft-bg px-2.5 py-1 text-2xs font-semibold text-success">On</span>}
      </div>
      <p className="mt-4 max-w-md text-sm text-ink-soft">Receive order alerts even when Hiatus is not open in this tab.</p>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button type="button" size="sm" variant={on ? "outline" : "primary"} onClick={toggle} disabled={busy}>
          {busy ? "Connecting…" : on ? "Turn off" : "Turn on"}
        </Button>
        {error?.includes("configuration changed") && <Button type="button" size="sm" variant="ghost" onClick={() => window.location.reload()}>Reconnect</Button>}
      </div>
      <FormError>{error}</FormError>
      <FormSuccess>{notice}</FormSuccess>
    </div>
  );
}

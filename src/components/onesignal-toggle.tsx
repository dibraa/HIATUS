"use client";
import { useEffect, useState } from "react";
import { enableOneSignal, ONE_SIGNAL_DEVICE_KEY, stopOneSignal } from "@/lib/onesignal-client";
import { Button } from "@/components/ui/button";
import { FormError, FormSuccess } from "@/components/ui/field";
export function OneSignalToggle() {
  const [on, setOn] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState<string | null>(null), [notice, setNotice] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    if (localStorage.getItem(ONE_SIGNAL_DEVICE_KEY) === "on") void enableOneSignal().then(sdk => { if (!cancelled) setOn(sdk.User.PushSubscription.optedIn); }).catch(() => {});
    return () => { cancelled = true; };
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
  async function test() {
    setBusy(true); setError(null);
    try { const result = await fetch("/api/integrations/push-test", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }); if (!result.ok) throw new Error("Test delivery failed. Check provider settings and try again."); setNotice("Test sent to your subscribed devices."); }
    catch (error) { setError((error as Error).message); } finally { setBusy(false); }
  }
  return <div className="flex flex-col gap-3 rounded-lg border border-line bg-card p-4"><p className="text-sm font-semibold">Browser notifications on this device</p><div className="flex flex-wrap gap-2"><Button type="button" onClick={toggle} disabled={busy}>{on ? "Turn off" : "Turn on"}</Button>{on && <Button type="button" variant="outline" onClick={test} disabled={busy}>Send a test</Button>}</div><FormError>{error}</FormError><FormSuccess>{notice}</FormSuccess></div>;
}

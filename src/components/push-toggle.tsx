"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { FormError, FormSuccess } from "@/components/ui/field";
import { removePushSubscription, savePushSubscription, sendTestNotification } from "@/app/actions/push";

type PushState =
  | "checking"
  | "unsupported"
  | "not-configured"
  | "ios-install"
  | "blocked"
  | "off"
  | "on";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

/**
 * Browser notifications for THIS device.
 *
 * A browser subscription belongs to one browser on one device, so this is a
 * per-device switch rather than a saved preference: turning it on here does
 * nothing for the customer's laptop. Which events notify is still decided by
 * the "What to tell you about" choices above, shared with on-site alerts.
 *
 * It acts immediately rather than on "Save preferences", because turning it
 * on has to happen inside the click — browsers only show the permission
 * prompt in response to a user gesture.
 */
export function PushToggle() {
  const [state, setState] = useState<PushState>("checking");
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    detect().then(([next, sub]) => {
      if (cancelled) return;
      setState(next);
      setSubscription(sub);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function turnOn() {
    setBusy(true);
    setError(null);
    setNotice(null);
    let sub: PushSubscription | null = null;
    try {
      const registration = await navigator.serviceWorker.ready;
      sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY!),
      });
      const result = await savePushSubscription(sub.toJSON(), navigator.userAgent);
      if (result.error) {
        // Not stored on the server means nothing would ever arrive: undo the
        // browser side too rather than leave a switch that looks on.
        await sub.unsubscribe();
        throw new Error(result.error);
      }
      setSubscription(sub);
      setState("on");
      setNotice("Notifications are on for this device.");
    } catch (err) {
      if (Notification.permission === "denied") {
        setState("blocked");
      } else {
        setError((err as Error).message || "Couldn't turn notifications on. Try again.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function turnOff() {
    if (!subscription) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    const { endpoint } = subscription;
    await subscription.unsubscribe().catch(() => {});
    // The browser side is what stops delivery; a failed server delete only
    // leaves a dead row the next send prunes, so it isn't shown as an error.
    await removePushSubscription(endpoint);
    setSubscription(null);
    setState("off");
    setNotice("Notifications are off for this device.");
    setBusy(false);
  }

  async function sendTest() {
    if (!subscription) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    const result = await sendTestNotification(subscription.toJSON());
    if (result.error) setError(result.error);
    else setNotice("Test sent. It should appear in a few seconds.");
    setBusy(false);
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-line bg-card p-4">
      <div>
        <p className="text-sm font-semibold text-ink">Browser notifications on this device</p>
        <p className="mt-1 text-sm text-muted">
          Get told when your order changes, even with this site closed.
        </p>
      </div>

      {state === "checking" && <p className="text-sm text-muted">Checking this browser…</p>}

      {state === "unsupported" && (
        <p className="text-sm text-ink-soft">This browser can&apos;t show notifications from websites.</p>
      )}

      {state === "not-configured" && (
        <p className="text-sm text-ink-soft">Browser notifications aren&apos;t set up yet.</p>
      )}

      {state === "ios-install" && (
        <p className="text-sm text-ink-soft">
          On iPhone and iPad, add Hiatus to your Home Screen first: tap the Share button, then
          &ldquo;Add to Home Screen&rdquo;. Open it from there and turn notifications on.
        </p>
      )}

      {state === "blocked" && (
        <p className="text-sm text-ink-soft">
          Notifications are blocked for this site. Allow them in your browser&apos;s site settings
          (the icon left of the address bar), then reload this page.
        </p>
      )}

      {state === "off" && (
        <Button type="button" size="md" onClick={turnOn} disabled={busy} className="self-start">
          {busy ? "Turning on…" : "Turn on"}
        </Button>
      )}

      {state === "on" && (
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="md" onClick={sendTest} disabled={busy}>
            Send a test
          </Button>
          <Button type="button" variant="ghost" size="md" onClick={turnOff} disabled={busy}>
            Turn off
          </Button>
        </div>
      )}

      <FormError>{error}</FormError>
      <FormSuccess>{notice}</FormSuccess>
    </div>
  );
}

async function detect(): Promise<[PushState, PushSubscription | null]> {
  if (!VAPID_PUBLIC_KEY) return ["not-configured", null];

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const installed = window.matchMedia("(display-mode: standalone)").matches;
  // iOS only exposes push to sites installed to the Home Screen (16.4+).
  if (isIOS && !installed && !("PushManager" in window)) return ["ios-install", null];

  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    return ["unsupported", null];
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
      updateViaCache: "none",
    });
    const sub = await registration.pushManager.getSubscription();
    if (sub) return ["on", sub];
  } catch {
    return ["unsupported", null];
  }

  return [Notification.permission === "denied" ? "blocked" : "off", null];
}

/** VAPID keys are URL-safe base64; pushManager.subscribe wants raw bytes. */
function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

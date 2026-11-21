"use client";

import { useEffect, useState } from "react";
import { currentIntegrations } from "@/lib/integration-client";
import { Button } from "@/components/ui/button";
import { FormError, FormSuccess } from "@/components/ui/field";
import { removePushSubscription, savePushSubscription } from "@/app/actions/push";

type PushState =
  | "checking"
  | "unsupported"
  | "not-configured"
  | "ios-install"
  | "blocked"
  | "off"
  | "on"
  | "reconnect";


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
  const [policy, setPolicy] = useState<ReturnType<typeof currentIntegrations>>(null);
  useEffect(() => { const sync = () => setPolicy(currentIntegrations()); sync(); window.addEventListener("hiatus:integrations", sync); return () => window.removeEventListener("hiatus:integrations", sync); }, []);
  if (!policy) return <p className="text-sm text-muted">Checking notification settings...</p>;
  if (!policy.push_enabled) return <p className="text-sm text-muted">Browser notifications are disabled.</p>;
  return policy.native_vapid_public_key ? <NativePushToggle publicKey={policy.native_vapid_public_key} /> : <p className="text-sm text-muted">Browser notifications are not configured.</p>;
}
function NativePushToggle({ publicKey }: { publicKey: string }) {
  const [state, setState] = useState<PushState>("checking");
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    detect(publicKey).then(([next, sub]) => {
      if (cancelled) return;
      setState(next);
      setSubscription(sub);
    });
    return () => {
      cancelled = true;
    };
  }, [publicKey]);

  async function turnOn() {
    setBusy(true);
    setError(null);
    setNotice(null);
    let sub: PushSubscription | null = null;
    try {
      const registration = await navigator.serviceWorker.ready;
      const old = await registration.pushManager.getSubscription();
      if (old && !matchesKey(old, publicKey)) {
        if (!await old.unsubscribe()) throw new Error("Could not reconnect notifications. Try again.");
        await removePushSubscription(old.endpoint);
      }
      sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const result = await savePushSubscription(sub.toJSON(), navigator.userAgent, publicKey);
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
        {state === "on" && <span className="rounded-full bg-success-soft-bg px-2.5 py-1 text-2xs font-semibold text-success">On</span>}
      </div>
      <p className="mt-4 max-w-md text-sm text-ink-soft">Receive order alerts even when Hiatus is not open in this tab.</p>

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

      {(state === "off" || state === "reconnect") && (
        <Button type="button" size="sm" onClick={turnOn} disabled={busy} className="mt-5">
          {busy ? "Connecting…" : state === "reconnect" ? "Reconnect notifications" : "Turn on"}
        </Button>
      )}

      {state === "on" && (
        <div className="mt-5">
          <Button type="button" variant="outline" size="sm" onClick={turnOff} disabled={busy}>
            Turn off
          </Button>
        </div>
      )}

      <FormError>{error}</FormError>
      <FormSuccess>{notice}</FormSuccess>
    </div>
  );
}

async function detect(publicKey: string): Promise<[PushState, PushSubscription | null]> {
  if (!publicKey) return ["not-configured", null];

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
    if (sub) return [matchesKey(sub, publicKey) ? "on" : "reconnect", sub];
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

function matchesKey(subscription: PushSubscription, publicKey: string): boolean {
  const existing = subscription.options?.applicationServerKey;
  if (!existing) return false;
  const wanted = urlBase64ToUint8Array(publicKey), actual = new Uint8Array(existing);
  return actual.length === wanted.length && actual.every((value, index) => value === wanted[index]);
}

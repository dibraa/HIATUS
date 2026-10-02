"use client";

import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { STATUS_LABELS } from "@/lib/order-meta";
import { shouldAlert, type AlertPreferences } from "@/lib/order-alerts";
import type { OrderStatus } from "@/types/database";

/**
 * On-site order alerts: a pop-up, a short chime and, while the customer is
 * on another tab, a changed tab title — whenever the status that
 * <AutoRefresh> brings back differs from the last one this browser saw.
 *
 * The last-seen status is kept in sessionStorage per order, so a change that
 * lands while the page is reloading, or while the customer was on another
 * page of the site, still alerts once they come back to this order.
 */
export function OrderAlerts({
  orderId,
  code,
  status,
  message,
  prefs,
}: {
  orderId: string;
  code: string;
  status: OrderStatus;
  /** The shop's own wording for this status (admin settings → templates). */
  message: string;
  prefs: AlertPreferences;
}) {
  const storageKey = `hiatus:order-status:${orderId}`;
  const lastSeen = useRef<OrderStatus | null>(null);
  // Each refresh hands over a new `prefs` object; depending on the two
  // booleans instead keeps the effect (and the tab title it set) from
  // resetting on every poll.
  const { order_updates, ready_alerts } = prefs;

  useEffect(() => {
    const previous = lastSeen.current ?? readStored(storageKey) ?? status;
    lastSeen.current = status;
    writeStored(storageKey, status);

    if (previous === status || !shouldAlert(previous, status, { order_updates, ready_alerts })) return;

    const label = STATUS_LABELS[status];
    toast(
      <span>
        <strong className="font-semibold">Order {code}: {label}</strong>
        <br />
        {message}
      </span>,
      { id: storageKey, duration: 10000, icon: status === "ready" ? "☕" : "🔔" }
    );
    playChime();
    return flagTabTitle(`${label} · Order ${code}`);
  }, [status, storageKey, code, message, order_updates, ready_alerts]);

  return null;
}

function readStored(key: string): OrderStatus | null {
  try {
    return sessionStorage.getItem(key) as OrderStatus | null;
  } catch {
    return null;
  }
}

function writeStored(key: string, value: OrderStatus) {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // Private mode or blocked storage: alerts still work within this visit.
  }
}

/**
 * Two soft notes from the Web Audio API — no sound file to ship. Browsers
 * refuse audio until the visitor has interacted with the page, so on a tab
 * nobody has touched this is silently skipped and the pop-up carries it.
 */
function playChime() {
  try {
    const ctx = new AudioContext();
    [660, 880].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = ctx.currentTime + i * 0.18;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.15, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.4);
    });
    setTimeout(() => ctx.close(), 1000);
  } catch {
    // No Web Audio support: the visual alert is enough.
  }
}

/**
 * While the tab is in the background, its title becomes "(1) Ready · …" so
 * the change is visible from the tab strip. Restored as soon as the customer
 * looks at the page again. Returns the cleanup for the effect.
 */
function flagTabTitle(text: string) {
  if (document.visibilityState === "visible") return;

  const original = document.title;
  document.title = `(1) ${text}`;

  const restore = () => {
    if (document.visibilityState !== "visible") return;
    document.title = original;
    document.removeEventListener("visibilitychange", restore);
  };
  document.addEventListener("visibilitychange", restore);

  return () => {
    document.title = original;
    document.removeEventListener("visibilitychange", restore);
  };
}

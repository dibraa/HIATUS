"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import { STATUS_LABELS } from "@/lib/order-meta";
import { shouldAlert, type AlertPreferences } from "@/lib/order-alerts";
import type { OrderStatus } from "@/types/database";

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
  message: string;
  prefs: AlertPreferences;
}) {
  const storageKey = `hiatus:order-status:${orderId}`;
  const lastSeen = useRef<OrderStatus | null>(null);
  const { order_updates, ready_alerts } = prefs;
  const [showReadyModal, setShowReadyModal] = useState(false);

  useEffect(() => {
    const previous = lastSeen.current ?? readStored(storageKey) ?? status;
    lastSeen.current = status;
    writeStored(storageKey, status);

    if (previous === status || !shouldAlert(previous, status, { order_updates, ready_alerts })) return;

    const label = STATUS_LABELS[status];
    if (status === "ready") {
      setShowReadyModal(true);
    } else {
      toast(
        <span>
          <strong className="font-semibold">Order {code}: {label}</strong>
          <br />
          {message}
        </span>,
        { id: storageKey, duration: 6000, icon: "🔔" }
      );
    }
    playChime();
    return flagTabTitle(`${label} · Order ${code}`);
  }, [status, storageKey, code, message, order_updates, ready_alerts]);

  return (
    <ReadyModal
      open={showReadyModal}
      code={code}
      message={message}
      onDismiss={() => setShowReadyModal(false)}
    />
  );
}

function ReadyModal({
  open,
  code,
  message,
  onDismiss,
}: {
  open: boolean;
  code: string;
  message: string;
  onDismiss: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 200);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onDismiss(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onDismiss]);

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
      onClick={onDismiss}
    >
      {/* Backdrop */}
      <div
        aria-hidden="true"
        className={`absolute inset-0 bg-ink/50 backdrop-blur-sm transition-opacity duration-(--hi-dur-base) ease-hi-out ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Card */}
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="ready-title"
        aria-describedby="ready-body"
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-sm overflow-hidden rounded-2xl border border-line bg-card shadow-xl transition-[opacity,transform] duration-(--hi-dur-base) ease-hi-out ${
          visible ? "opacity-100 scale-100" : "opacity-0 scale-[0.97]"
        }`}
      >
        {/* Green header band */}
        <div className="flex flex-col items-center gap-2 bg-inverse-bg px-6 pb-6 pt-8 text-center">
          <span className="text-5xl" aria-hidden="true">☕</span>
          <h2 id="ready-title" className="display text-3xl text-inverse-display mt-2">
            Order ready!
          </h2>
          <p className="font-mono text-sm font-medium text-inverse-muted">
            Order {code}
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-5 text-center">
          <p id="ready-body" className="text-base text-ink">{message}</p>
          <p className="mt-1.5 text-sm text-muted">
            Come to the counter and show code{" "}
            <span className="font-mono font-semibold text-ink">{code}</span>.
          </p>
        </div>

        {/* Action */}
        <div className="border-t border-line px-6 pb-6 pt-4">
          <button
            onClick={onDismiss}
            autoFocus
            className="w-full rounded-xl bg-cta py-3 text-sm font-semibold text-cta-fg transition-colors hover:bg-cta-hover focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            Got it
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
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
  } catch {}
}

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
  } catch {}
}

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

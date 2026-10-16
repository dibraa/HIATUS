"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { OrderNotification } from "@/types/database";

export function NotificationList({ notifications }: { notifications: OrderNotification[] }) {
  const [read, setRead] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      try {
        const stored = window.localStorage.getItem("hiatus:notifications:read");
        if (stored) setRead(JSON.parse(stored) as Record<string, boolean>);
      } catch {
        // Notifications remain usable when browser storage is unavailable.
      }
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  function markAllRead() {
    const next = Object.fromEntries(notifications.map((notification) => [notification._id ?? notification.id, true]));
    setRead(next);
    try {
      window.localStorage.setItem("hiatus:notifications:read", JSON.stringify(next));
    } catch {
      // The in-memory state still keeps the list consistent.
    }
  }

  if (notifications.length === 0) {
    return <p className="rounded-lg border border-dashed border-line-strong bg-card px-6 py-10 text-center text-sm text-muted">You have no notifications yet.</p>;
  }

  return (
    <section className="rounded-xl border border-line bg-card">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <p className="text-sm text-muted">{notifications.length} notification{notifications.length === 1 ? "" : "s"}</p>
        <button type="button" onClick={markAllRead} className="text-xs text-muted underline underline-offset-4 hover:text-ink">Mark all as read</button>
      </div>
      <ul>
        {notifications.map((notification) => (
          <li key={notification._id ?? notification.id} className="border-b border-line last:border-0">
            <Link href={`/orders/${notification.order_id}`} className="block px-5 py-4 transition-colors hover:bg-raised">
              <div className="flex items-start gap-3">
                <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${read[notification._id ?? notification.id] ? "bg-line-strong" : "bg-accent"}`} aria-hidden="true" />
                <span>
                  <span className="block text-sm font-semibold text-ink">{notification.title}</span>
                  <span className="mt-0.5 block text-sm text-ink-soft">{notification.body}</span>
                  <span className="mt-1 block text-xs text-muted">Order {notification.order_id.slice(-6).toUpperCase()} · {formatRelativeTime(notification.created_at)}</span>
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function formatRelativeTime(value: string) {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return "recently";
  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

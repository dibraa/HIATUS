"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import type { OrderNotification } from "@/types/database";

export function NotificationBell({ notifications: initialNotifications }: { notifications: OrderNotification[] }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [read, setRead] = useState<Record<string, boolean>>({});
  const knownNotifications = useRef(new Set(initialNotifications.map((notification) => notification._id ?? notification.id)));

  const previewNotifications = useMemo(() => notifications.slice(0, 8), [notifications]);
  const unreadCount = notifications.filter((notification) => !read[notification._id ?? notification.id]).length;

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

  useEffect(() => {
    const poll = async () => {
      try {
        const response = await fetch("/api/notifications", { cache: "no-store" });
        if (!response.ok) return;
        const nextNotifications = (await response.json()) as OrderNotification[];

        for (const notification of nextNotifications) {
          const id = notification._id ?? notification.id;
          if (!knownNotifications.current.has(id)) {
            toast(
              <span>
                <strong className="font-semibold">{notification.title}</strong>
                <br />
                {notification.body}
              </span>,
              { id: `notification:${id}`, icon: "🔔", duration: 6000 }
            );
          }
          knownNotifications.current.add(id);
        }

        setNotifications(nextNotifications);
      } catch {
        // The next poll retries; the existing notification list remains usable.
      }
    };

    const interval = window.setInterval(poll, 15000);
    return () => window.clearInterval(interval);
  }, []);

  function markAllRead() {
    const next = Object.fromEntries(notifications.map((notification) => [notification._id ?? notification.id, true]));
    setRead(next);
    try {
      window.localStorage.setItem("hiatus:notifications:read", JSON.stringify(next));
    } catch {
      // The in-memory state still keeps the open list consistent.
    }
  }

  function toggleOpen() {
    if (!open) markAllRead();
    setOpen(!open);
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
        aria-expanded={open}
        aria-controls="notification-panel"
        onClick={toggleOpen}
        className="relative flex h-10 w-10 items-center justify-center rounded-md text-ink transition-colors hover:bg-raised"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
          <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 8.5h18C21 16 18 16 18 9ZM10 21h4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute right-0.5 top-0.5 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold leading-none text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close notifications"
            className="fixed inset-0 z-30 cursor-default lg:hidden"
            onClick={() => setOpen(false)}
          />
          <section
            id="notification-panel"
            aria-label="Notifications"
            className="absolute right-0 top-12 z-40 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-line bg-card shadow-lg"
          >
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <h2 className="display text-xl text-ink">Notifications</h2>
              {previewNotifications.length > 0 && (
                <button type="button" onClick={markAllRead} className="text-xs text-muted underline underline-offset-4 hover:text-ink">
                  Mark read
                </button>
              )}
            </div>

            {previewNotifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted">You have no notifications yet.</p>
            ) : (
              <ul className="max-h-[min(28rem,70vh)] overflow-y-auto">
                {previewNotifications.map((notification) => {
                  const id = notification._id ?? notification.id;
                  return <li key={id} className="border-b border-line last:border-0">
                    <Link
                      href={`/orders/${notification.order_id}`}
                      onClick={() => setOpen(false)}
                      className="block px-4 py-3 transition-colors hover:bg-raised"
                    >
                      <div className="flex items-start gap-3">
                        <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${read[id] ? "bg-line-strong" : "bg-accent"}`} aria-hidden="true" />
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-ink">{notification.title}</span>
                          <span className="mt-0.5 block text-sm text-ink-soft">{notification.body}</span>
                          <span className="mt-1 block text-xs text-muted">
                            Order {notification.order_id.slice(-6).toUpperCase()} · {formatRelativeTime(notification.created_at)}
                          </span>
                        </span>
                      </div>
                    </Link>
                  </li>;
                })}
              </ul>
            )}

            <Link href="/notifications" onClick={() => setOpen(false)} className="ui-caps block border-t border-line px-4 py-3 text-center text-2xs text-ink-soft hover:text-ink">
              View all notifications
            </Link>
          </section>
        </>
      )}
    </div>
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

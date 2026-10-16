"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";

type Alerts = {
  fresh: number;
  unpaidCount: number;
  unpaidTotal: string;
};

/**
 * The counter's slim utility bar: station identity, connectivity, global
 * search, alerts, theme, shift state, and sign out. Status and utilities
 * only, never brand, section nav, or order metrics.
 */
export function StaffTopbar({
  staffName,
  onShift,
  since,
  alerts,
}: {
  staffName: string;
  onShift: boolean;
  since: string | null;
  alerts: Alerts;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState("");
  const [alertsOpen, setAlertsOpen] = useState(false);
  const initial = staffName.trim().charAt(0).toUpperCase() || "S";
  const hasAlerts = alerts.fresh > 0 || alerts.unpaidCount > 0;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "Escape") setAlertsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = draft.trim();
    const params = new URLSearchParams(
      pathname === "/staff" ? searchParams.toString() : "",
    );
    if (q) params.set("q", q);
    else params.delete("q");
    router.push(`/staff${params.size ? `?${params}` : ""}`);
    searchRef.current?.blur();
  }

  const searchBox = (id: string) => (
    <form role="search" onSubmit={submitSearch} className="relative w-full">
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 fill-none stroke-muted"
        strokeWidth="1.9"
        strokeLinecap="round"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-3.5-3.5" />
      </svg>
      <label htmlFor={id} className="sr-only">
        Search order, customer, or item
      </label>
      <input
        ref={id === "staff-global-search" ? searchRef : undefined}
        id={id}
        type="search"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Search order #, customer, or item... (Ctrl + K)"
        autoComplete="off"
        className="min-h-11 w-full rounded-full border border-line-strong bg-card py-2 pl-11 pr-20 text-sm text-ink placeholder:text-muted transition-colors hover:border-ink-soft focus:border-ink"
      />
      <kbd
        aria-hidden="true"
        className="ui-caps pointer-events-none absolute right-3.5 top-1/2 hidden -translate-y-1/2 rounded-md border border-line px-1.5 py-0.5 text-2xs text-muted sm:inline"
      >
        Ctrl K
      </kbd>
    </form>
  );

  return (
    <div className="border-b border-line bg-surface">
      <div className="flex min-h-14 items-center gap-2 px-3 sm:gap-3 sm:px-4 lg:px-6">
        <div className="w-full max-w-md flex-1 max-md:hidden">
          {searchBox("staff-global-search")}
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1">
          <span className="relative">
            <button
              type="button"
              onClick={() => setAlertsOpen((v) => !v)}
              aria-label={
                hasAlerts ? "Alerts, needs attention" : "Alerts, all clear"
              }
              aria-haspopup="true"
              aria-expanded={alertsOpen}
              className="grid h-11 w-11 place-items-center rounded-xl text-ink-soft transition-colors hover:bg-raised hover:text-ink"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-5 w-5 fill-none stroke-current"
                strokeWidth="1.9"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" />
              </svg>
              {hasAlerts && (
                <span
                  aria-hidden="true"
                  className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-accent"
                />
              )}
            </button>
            {alertsOpen && (
              <div className="absolute right-0 top-[calc(100%+6px)] z-40 grid w-64 gap-1 rounded-2xl bg-card p-2 shadow-md ring-1 ring-line-strong">
                {alerts.fresh > 0 && (
                  <Link
                    href="/staff?tab=pending"
                    onClick={() => setAlertsOpen(false)}
                    className="rounded-xl px-3 py-2.5 text-sm text-ink transition-colors hover:bg-raised"
                  >
                    <span className="numeric font-semibold">
                      {alerts.fresh}
                    </span>{" "}
                    new {alerts.fresh === 1 ? "order" : "orders"} waiting to
                    start
                  </Link>
                )}
                {alerts.unpaidCount > 0 && (
                  <Link
                    href="/staff?tab=unpaid"
                    onClick={() => setAlertsOpen(false)}
                    className="rounded-xl px-3 py-2.5 text-sm text-ink transition-colors hover:bg-raised"
                  >
                    <span className="numeric font-semibold">
                      {alerts.unpaidCount}
                    </span>{" "}
                    awaiting payment ({alerts.unpaidTotal})
                  </Link>
                )}
                {!hasAlerts && (
                  <p className="px-3 py-2.5 text-sm text-muted">
                    All clear. Nothing needs attention.
                  </p>
                )}
              </div>
            )}
          </span>

          <ThemeToggle />

          <Link
            href="/staff/shift"
            className="ui-caps ml-1 hidden min-h-11 items-center gap-1.5 rounded-full px-3 text-2xs transition-colors hover:bg-raised sm:inline-flex"
          >
            <span
              aria-hidden="true"
              className={`h-2 w-2 rounded-full ${onShift ? "bg-success" : "bg-warning"}`}
            />
            <span className={onShift ? "text-success" : "text-warning"}>
              {onShift ? "Clocked in" : "Clock in"}
            </span>
            {since && onShift && <span className="sr-only">since {since}</span>}
          </Link>

          <span
            className="ml-1 hidden items-center gap-2 sm:flex"
            title={staffName}
          >
            <span
              aria-hidden="true"
              className="grid h-9 w-9 place-items-center rounded-full bg-ink text-xs font-bold text-surface"
            >
              {initial}
            </span>
            <span className="hidden max-w-28 truncate text-sm font-semibold text-ink xl:inline">
              {staffName}
            </span>
          </span>
          <SignOutButton />
        </div>
      </div>

      <div className="px-3 pb-2.5 md:hidden">
        {searchBox("staff-global-search-m")}
      </div>
    </div>
  );
}

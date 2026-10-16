"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/staff", label: "Queue", icon: <path d="M4 6h16M4 12h16M4 18h10" /> },
  {
    href: "/staff/pos",
    label: "POS",
    icon: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 10h18" />
      </>
    ),
  },
  {
    href: "/staff/menu",
    label: "Sold out",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M6 6l12 12" />
      </>
    ),
  },
  {
    href: "/staff/shift",
    label: "Shift",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
  },
];

/**
 * The counter's fixed rail: brand, who is on shift, the four sections, and
 * sign out. A rail rather than a top bar so the queue keeps its full width
 * and the sections stay in one glanceable column during a rush.
 */
export function StaffSidebar({
  staffName,
  newCount = 0,
  onShift,
  since,
  drawerCash,
}: {
  staffName: string;
  newCount?: number;
  onShift: boolean;
  since: string | null;
  drawerCash: string | null;
}) {
  const pathname = usePathname();
  const initial = staffName.trim().charAt(0).toUpperCase() || "S";

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-4 pb-3 pt-5">
        <span aria-hidden="true" className="display grid h-9 w-9 place-items-center rounded-xl bg-accent text-xl text-accent-fg">
          H
        </span>
        <span className="min-w-0">
          <span className="display block text-xl leading-none text-ink">Counter</span>
          <span className="ui-caps mt-1 block text-2xs text-muted">Hiatus</span>
        </span>
      </div>

      <div className="mx-3 mb-2 flex items-center gap-2.5 rounded-2xl bg-raised p-3">
        <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink text-sm font-bold text-surface">
          {initial}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-ink">{staffName}</span>
          <Link
            href="/staff/shift"
            className="ui-caps mt-1 inline-flex min-h-7 items-center gap-1.5 rounded-full px-2.5 text-2xs transition-colors hover:bg-card"
          >
            <span aria-hidden="true" className={`h-2 w-2 rounded-full ${onShift ? "bg-success" : "bg-warning"}`} />
            <span className={onShift ? "text-success" : "text-warning"}>
              {onShift ? "Clocked in" : "Clock in"}
            </span>
          </Link>
        </span>
      </div>

      <nav aria-label="Staff sections" className="min-w-0 px-3">
        <p className="ui-caps px-2 pb-1 pt-2 text-2xs text-muted">Operate</p>
        <ul className="grid gap-0.5">
          {LINKS.map((link) => {
            const active = link.href === "/staff" ? pathname === "/staff" : pathname.startsWith(link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={`ui-caps inline-flex min-h-11 w-full items-center gap-2.5 rounded-xl px-3 text-2xs transition-colors ${
                    active ? "bg-ink text-surface" : "text-ink-soft hover:bg-raised hover:text-ink"
                  }`}
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-5 w-5 fill-none stroke-current"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {link.icon}
                  </svg>
                  {link.label}
                  {link.href === "/staff" && newCount > 0 && (
                    <span className="numeric ml-auto inline-grid min-w-5 place-items-center rounded-full bg-accent px-1.5 text-2xs text-accent-fg">
                      {newCount}
                      <span className="sr-only"> new</span>
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
        {(since || drawerCash) && (
          <p className="ui-caps px-2 pt-3 text-2xs text-muted">
            {since && <>Since {since}</>}
            {since && drawerCash && <> · </>}
            {drawerCash && <span className="numeric">{drawerCash}</span>}
          </p>
        )}
      </nav>

      <div className="mt-auto border-t border-line px-5 py-3.5">
        <p className="text-xs tracking-wide text-muted">
          {onShift ? (
            <>{since ? <>Since <span className="numeric font-semibold text-ink-soft">{since}</span></> : <>On shift</>}{drawerCash ? <> · drawer <span className="numeric font-semibold text-ink-soft">{drawerCash}</span></> : null}</>
          ) : (
            <Link href="/staff/shift" className="font-semibold text-ink-soft underline underline-offset-4 hover:text-ink">
              Clock in to start your shift
            </Link>
          )}
        </p>
      </div>
    </div>
  );
}

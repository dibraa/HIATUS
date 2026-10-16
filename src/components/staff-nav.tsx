"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * The counter's sections, icon + label, 48px tall. The queue carries a count
 * of NEW orders so a barista on another screen still sees one arrive; the
 * count has its own accessible phrase ("3 new") rather than a bare number.
 */
const LINKS: { href: string; label: string; icon: ReactNode }[] = [
  {
    href: "/staff",
    label: "Counter",
    icon: <path d="M4 6h16M4 12h16M4 18h10" />,
  },
  {
    href: "/staff/menu",
    label: "Availability",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M6 6l12 12" />
      </>
    ),
  },
  {
    href: "/staff/shift",
    label: "My shift",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
  },
];

export function StaffNav({ newCount = 0 }: { newCount?: number }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Staff sections" className="min-w-0">
      <ul className="no-scrollbar flex gap-1 overflow-x-auto">
        {LINKS.map((link) => {
          const active =
            link.href === "/staff"
              ? pathname === "/staff" || pathname.startsWith("/staff/pos")
              : pathname.startsWith(link.href);
          return (
            <li key={link.href} className="shrink-0">
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`ui-caps inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-2xs transition-colors sm:px-3.5 ${
                  active
                    ? "bg-accent text-accent-fg"
                    : "text-ink-soft hover:bg-raised hover:text-ink"
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
                  <span className="numeric inline-grid min-w-5 place-items-center rounded-full bg-accent px-1.5 text-2xs text-accent-fg">
                    {newCount}
                    <span className="sr-only"> new</span>
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

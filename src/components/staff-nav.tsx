"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Staff section nav.
 *
 * Client-side because it needs the pathname to mark the current section —
 * without that, four identical links give no indication of where you are. The
 * espresso underline is the visual cue; `aria-current` is the announced one, and
 * neither is load-bearing alone.
 *
 * Scrolls horizontally rather than wrapping: the counter runs this on a phone
 * propped by the till, and a nav that reflows to two rows moves the queue down
 * the screen every time the viewport changes.
 */
const LINKS = [
  { href: "/staff", label: "Queue" },
  { href: "/staff/pos", label: "Payments" },
  { href: "/staff/menu", label: "Availability" },
  { href: "/staff/shift", label: "My shift" },
];

export function StaffNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Staff sections" className="border-b border-line">
      <ul className="no-scrollbar -mb-px flex gap-1 overflow-x-auto">
        {LINKS.map((link) => {
          // "/staff" would otherwise match every child route, so the index is
          // matched exactly while the sections match their subtree.
          const active =
            link.href === "/staff"
              ? pathname === "/staff"
              : pathname.startsWith(link.href);

          return (
            <li key={link.href} className="shrink-0">
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={
                  active
                    ? "ui-caps inline-flex items-center whitespace-nowrap border-b-2 border-cta px-3 py-3 text-2xs text-ink"
                    : "ui-caps inline-flex items-center whitespace-nowrap border-b-2 border-transparent px-3 py-3 text-2xs text-muted transition-colors hover:border-line-strong hover:text-ink"
                }
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

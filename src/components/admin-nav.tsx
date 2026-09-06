"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Admin section nav.
 *
 * Client-side only because it needs the pathname to mark the current section —
 * without that, identical links give no indication of where you are. The
 * espresso underline is the visual cue; `aria-current` is the announced one.
 *
 * Ordered by how often it is opened, not alphabetically: the dashboard and the
 * live order list are daily, the team and the settings are not.
 */
const LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/menu", label: "Menu" },
  { href: "/admin/promos", label: "Promos" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/team", label: "Team" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin sections" className="border-b border-line">
      {/* Scrolls rather than wraps: seven sections wrap to two rows on a
          phone, which moves the page content down every time. */}
      <ul className="no-scrollbar -mb-px flex gap-1 overflow-x-auto">
        {LINKS.map((link) => {
          // "/admin" would otherwise match every child route, so the index is
          // matched exactly while the sections match their subtree.
          const active =
            link.href === "/admin"
              ? pathname === "/admin"
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

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Analytics" },
  { href: "/admin/menu", label: "Menu" },
  { href: "/admin/orders", label: "Orders" },
];

/**
 * Admin section nav.
 *
 * Client-side only because it needs the pathname to mark the current section —
 * without that, three identical links gave no indication of where you were.
 * The underline is the visual cue; aria-current is the announced one.
 */
export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin sections" className="border-b border-line">
      <ul className="-mb-px flex gap-1">
        {LINKS.map((link) => {
          // "/admin" would otherwise match every child route, so the index is
          // matched exactly while the sections match their subtree.
          const active =
            link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);

          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={
                  active
                    ? "inline-flex items-center border-b-2 border-accent px-3 py-2.5 text-sm font-medium text-ink"
                    : "inline-flex items-center border-b-2 border-transparent px-3 py-2.5 text-sm font-medium text-muted transition-colors duration-150 ease-hi hover:border-line-strong hover:text-ink"
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

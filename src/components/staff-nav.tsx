"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/staff", label: "Queue" },
  { href: "/staff/pos", label: "POS" },
  { href: "/staff/menu", label: "Availability" },
  { href: "/staff/shift", label: "My shift" },
];

export function StaffNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Staff sections">
      <ul className="flex gap-1">
        {LINKS.map((link) => {
          const active =
            link.href === "/staff"
              ? pathname === "/staff"
              : pathname.startsWith(link.href);

          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={
                  active
                    ? "display inline-flex items-center px-3 py-2 text-sm text-ink"
                    : "display inline-flex items-center px-3 py-2 text-sm text-muted transition-colors hover:text-ink"
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

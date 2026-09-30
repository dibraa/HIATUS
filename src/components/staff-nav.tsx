"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/staff", label: "Queue" },
  { href: "/staff/pos", label: "POS" },
  { href: "/staff/menu", label: "Availability" },
  { href: "/staff/shift", label: "My shift" },
];

const CHIP =
  "ui-caps inline-flex h-11 items-center whitespace-nowrap rounded-md border px-3.5 text-2xs transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

export function StaffNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Staff sections" className="flex items-center gap-1">
      <ul className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1 py-0.5">
        {LINKS.map((link) => {
          const active =
            link.href === "/staff"
              ? pathname === "/staff"
              : pathname.startsWith(link.href);

          return (
            <li key={link.href} className="min-w-0 shrink-0">
              <Link
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={
                  active
                    ? `${CHIP} border-ink bg-raised text-ink`
                    : `${CHIP} border-line-strong bg-card text-ink-soft hover:border-ink hover:text-ink`
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

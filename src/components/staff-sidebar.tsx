"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { BrandMark } from "./brand";
import { SignOutButton } from "./sign-out-button";

/** Icon + label, the same marks the mobile StaffNav uses. */
const SECTIONS: { href: string; label: string; icon: ReactNode }[] = [
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

export function StaffSidebar({
  staffName,
  staffEmail,
}: {
  staffName: string;
  staffEmail: string;
}) {
  const pathname = usePathname();
  return (
    <div className="counter-sidebar-inner">
      {/* The welcome page's mark; it is the word, so no text sits beside it. */}
      <Link
        href="/staff"
        className="counter-brand group"
        aria-label="Hiatus staff counter"
      >
        <BrandMark />
      </Link>
      <nav aria-label="Staff sections" className="counter-navigation">
        {SECTIONS.map((section) => {
          const active =
            section.href === "/staff"
              ? pathname === "/staff" || pathname.startsWith("/staff/pos")
              : pathname.startsWith(section.href);
          return (
            <Link
              key={section.href}
              href={section.href}
              className="counter-nav-link"
              aria-current={active ? "page" : undefined}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="counter-nav-icon"
              >
                {section.icon}
              </svg>
              {section.label}
            </Link>
          );
        })}
      </nav>
      <div className="counter-staff-identity">
        <p className="font-semibold">{staffName}</p>
        <p className="counter-staff-email">{staffEmail}</p>
        <SignOutButton />
      </div>
    </div>
  );
}

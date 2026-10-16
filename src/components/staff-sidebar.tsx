"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "./sign-out-button";

const SECTIONS = [
  { href: "/staff", label: "Counter", detail: "Orders & payments" },
  { href: "/staff/menu", label: "Availability", detail: "What's brewing" },
  { href: "/staff/shift", label: "My shift", detail: "Time & cash drawer" },
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
      <Link
        href="/staff"
        className="counter-brand"
        aria-label="Hiatus staff counter"
      >
        <Image
          src="/logo.png"
          alt=""
          width={44}
          height={44}
          className="rounded-2xl bg-white"
        />
        <span>
          <span className="display counter-wordmark">Hiatus</span>
          <span className="counter-brand-caption">The coffee counter</span>
        </span>
      </Link>
      <nav aria-label="Staff sections" className="counter-navigation">
        <p className="ui-caps counter-nav-label">Your workspace</p>
        {SECTIONS.map((section, index) => {
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
              <span className="numeric counter-nav-number">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span>
                <strong>{section.label}</strong>
                <small>{section.detail}</small>
              </span>
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

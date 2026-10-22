"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminIcon, type AdminIconName } from "@/components/admin-icon";

const LINKS: { href: string; label: string; icon: AdminIconName }[] = [
  { href: "/admin", label: "Dashboard", icon: "dashboard" },
  { href: "/admin/orders", label: "Orders", icon: "orders" },
  { href: "/admin/menu", label: "Menu", icon: "menu" },
  { href: "/admin/reports", label: "Reports", icon: "reports" },
  { href: "/admin/team", label: "Users", icon: "team" },
  { href: "/admin/settings", label: "Settings", icon: "settings" },
];

export function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin sections">
      <ul className="admin-nav-list">
        {LINKS.map((link) => {
          const active = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
          return (
            <li key={link.href}>
              <Link href={link.href} onClick={onNavigate} aria-current={active ? "page" : undefined} className="admin-nav-link">
                <AdminIcon name={link.icon} />
                <span>{link.label}</span>
                {active && <span className="admin-nav-current" aria-hidden="true" />}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

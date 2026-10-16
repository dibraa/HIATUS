"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AdminIcon } from "@/components/admin-icon";

export function AdminBackButton() {
  const pathname = usePathname();
  if (!pathname.startsWith("/admin/menu/")) return null;
  return (
    <div className="admin-menu-context">
      <nav aria-label="Breadcrumb"><ol><li><Link href="/admin">Dashboard</Link></li><li><Link href="/admin/menu">Menu</Link></li><li aria-current="page">{pathname === "/admin/menu/new" ? "Add item" : "Edit item"}</li></ol></nav>
      <Link href="/admin/menu" className="admin-back-link"><AdminIcon name="back" />Back to Menu</Link>
    </div>
  );
}

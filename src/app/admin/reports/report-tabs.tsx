"use client";
import { usePermissions } from "@/components/permission-controls";
import { useState } from "react";
import Link from "next/link";
import type { ReportView } from "@/lib/finance";

export function ReportTabs({ view, period, date, today }: { view: ReportView; period: string; date: string; today: string }) {
  const { can } = usePermissions();
  const [instant, setInstant] = useState(false);
  const tabs = [["sales", "Sales"], ["customers", "Customers"], ["transactions", "Transactions"], ["refunds", "Refunds & Disputes"], ["reconciliation", "Reconciliation"]] as const;
  return <nav className="report-tabs mb-5" data-instant={instant || undefined} aria-label="Report sections" onKeyDown={() => setInstant(true)} onPointerDown={() => setInstant(false)}>
    {tabs.filter(([key]) => ["sales", "customers"].includes(key) || can("finance.view")).map(([key, label]) => {
      if (key === "reconciliation") return <Link key={key} href={`/admin/reports?view=reconciliation&date=${today}`} aria-current={view === key ? "page" : undefined}>{label}</Link>;
      const selectedPeriod = period === "all" && (key === "sales" || key === "customers") ? "monthly" : period;
      const query = new URLSearchParams({ view: key, period: selectedPeriod });
      if (selectedPeriod !== "all") query.set("date", date || today.slice(0, 7));
      return <Link key={key} href={`/admin/reports?${query}`} aria-current={view === key ? "page" : undefined}>{label}</Link>;
    })}
  </nav>;
}

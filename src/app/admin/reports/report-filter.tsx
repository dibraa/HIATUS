"use client";
import { useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { SelectField, TextField } from "@/components/ui/field";

export function ReportFilter({ period, date, view = "sales", search = "", kind = "", method = "", status = "", order = "" }: { period: string; date: string; view?: string; search?: string; kind?: string; method?: string; status?: string; order?: string }) {
  const [selected, setSelected] = useState(period);
  const [value, setValue] = useState(date);
  const [searchValue, setSearchValue] = useState(search);
  const searchTimer = useRef<number | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  function apply(nextPeriod: string, nextDate: string, extra: Record<string, string> = {}) {
    const params = new URLSearchParams({ view, period: nextPeriod, date: nextDate, search: searchValue, ...extra });
    if (order) params.set("order", order);
    router.push(`${pathname}?${params}`);
  }
  function change(next: string) {
    setSelected(next);
    const source = value || new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(new Date());
    const day = source.length === 4 ? `${source}-01-01` : source.length === 7 ? `${source}-01` : source;
    const nextDate = next === "annual" ? day.slice(0, 4) : next === "monthly" ? day.slice(0, 7) : day;
    setValue(nextDate);
    apply(next, nextDate, { kind, method, status });
  }
  return <form aria-label="Report filters" className="admin-panel mb-6 flex flex-wrap items-end gap-4" onSubmit={event => event.preventDefault()}>
    <input type="hidden" name="view" value={view} />
    {order && <><input type="hidden" name="order" value={order} /><p className="w-full text-sm text-muted">Showing records for order {order}. <a href={`/admin/reports?view=${view}&period=all`} className="underline underline-offset-4">Show all orders</a></p></>}
    <SelectField id="report-period" name="period" label="Period" value={selected} onChange={event => change(event.target.value)}>{["transactions", "refunds"].includes(view) && <option value="all">All time</option>}<option value="daily">Daily</option><option value="monthly">Monthly</option><option value="annual">Annual</option></SelectField>
    {selected !== "all" && <TextField id="report-date" name="date" label={selected === "daily" ? "Day" : selected === "monthly" ? "Month" : "Year"} type={selected === "daily" ? "date" : selected === "monthly" ? "month" : "number"} min={selected === "annual" ? "2000" : selected === "monthly" ? "2000-01" : "2000-01-01"} max={selected === "annual" ? "2100" : selected === "monthly" ? "2100-12" : "2100-12-31"} required value={value} onChange={event => { setValue(event.target.value); apply(selected, event.target.value, { kind, method, status }); }} />}
    {view !== "sales" && <TextField id="report-search" name="search" label={view === "customers" ? "Customer name" : view === "refunds" ? "Order / reference / issue" : "Order / reference / customer"} type="search" maxLength={100} value={searchValue} onChange={event => { const next = event.target.value; setSearchValue(next); if (searchTimer.current) window.clearTimeout(searchTimer.current); searchTimer.current = window.setTimeout(() => apply(selected, value, { kind, method, status, search: next }), 350); }} />}
    {view === "transactions" && <SelectField id="report-kind" name="kind" label="Transaction" defaultValue={kind} onChange={event => apply(selected, value, { kind: event.target.value, search, method, status })}><option value="">All types</option><option value="payment">Payment</option><option value="refund">Refund</option><option value="void">Void</option></SelectField>}
    {["transactions", "refunds"].includes(view) && <SelectField id="report-method" name="method" label={view === "refunds" ? "Refund method" : "Method"} defaultValue={method} onChange={event => apply(selected, value, { kind, search, method: event.target.value, status })}><option value="">All methods</option><option value="cash">Cash</option><option value="ewallet">E-wallet</option></SelectField>}
    {view === "refunds" && <SelectField id="report-status" name="status" label="Case status" defaultValue={status} onChange={event => apply(selected, value, { kind, search, method, status: event.target.value })}><option value="">All case states</option><option value="open">Open</option><option value="in_review">In review</option><option value="resolved">Resolved</option></SelectField>}
  </form>;
}

"use client";
import { useState } from "react";
import { SelectField, TextField } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export function ReportFilter({ period, date }: { period: string; date: string }) {
  const [selected, setSelected] = useState(period);
  const [value, setValue] = useState(date);
  function change(next: string) {
    setSelected(next);
    const day = value.length === 4 ? `${value}-01-01` : value.length === 7 ? `${value}-01` : value;
    setValue(next === "annual" ? day.slice(0, 4) : next === "monthly" ? day.slice(0, 7) : day);
  }
  return <form action="/admin/reports" aria-label="Sales report period" className="admin-panel mb-6 flex flex-wrap items-end gap-4">
    <SelectField id="report-period" name="period" label="Report" value={selected} onChange={event => change(event.target.value)}><option value="daily">Daily</option><option value="monthly">Monthly</option><option value="annual">Annual</option></SelectField>
    <TextField id="report-date" name="date" label={selected === "daily" ? "Day" : selected === "monthly" ? "Month" : "Year"} type={selected === "daily" ? "date" : selected === "monthly" ? "month" : "number"} min={selected === "annual" ? "2000" : selected === "monthly" ? "2000-01" : "2000-01-01"} max={selected === "annual" ? "2100" : selected === "monthly" ? "2100-12" : "2100-12-31"} required value={value} onChange={event => setValue(event.target.value)} />
    <Button type="submit">Generate report</Button>
    <p className="w-full text-sm text-muted">Calendar dates use Asia/Manila. Revenue includes paid, completed orders by order date; refunds, voids, cancellations, and unpaid orders are excluded.</p>
  </form>;
}

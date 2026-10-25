"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/field";

export function ExcelExportButton({ period, date, enabled, view = "sales", filters = {} }: { period: string; date: string; enabled: boolean | null; view?: string; filters?: Record<string, string> }) {
  const [format, setFormat] = useState("xlsx");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function download() {
    setPending(true); setError(null);
    try {
      const query = new URLSearchParams({ ...filters, view, period, date, format });
      const response = await fetch(`/api/admin/reports/export?${query}`, { cache: "no-store" });
      if (!response.ok) throw new Error((await response.json()).error || "Export failed. Try again.");
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a"); link.href = url; link.download = `hiatus-${view}-${date || "all-time"}.${format}`; document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (failure) { setError((failure as Error).message); }
    finally { setPending(false); }
  }
  return <div className="flex max-w-sm flex-col gap-2">
    <div className="flex flex-wrap gap-2"><label className="sr-only" htmlFor="report-export-format">Export format</label><select id="report-export-format" className="min-h-11 rounded-md border border-line-strong bg-card px-3 text-sm text-ink" value={format} disabled={!enabled || pending} onChange={event => setFormat(event.target.value)}><option value="xlsx">Excel</option><option value="csv">CSV</option><option value="pdf">PDF</option></select><Button variant="outline" disabled={!enabled || pending} loading={pending} onClick={download}>{pending ? "Preparing export…" : "Export report"}</Button></div>
    {!enabled && <p className="text-sm text-muted">{enabled === null ? "Export settings could not load. Reload this page to try again." : "Report exports are disabled. Enable them in Settings → API controls."}</p>}
    <FormError>{error}</FormError>
  </div>;
}

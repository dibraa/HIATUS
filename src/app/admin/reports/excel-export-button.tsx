"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/field";

export function ExcelExportButton({ period, date, enabled }: { period: string; date: string; enabled: boolean | null }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function download() {
    setPending(true); setError(null);
    try {
      const query = new URLSearchParams({ period, date });
      const response = await fetch(`/api/admin/reports/export?${query}`, { cache: "no-store" });
      if (!response.ok) throw new Error((await response.json()).error || "Export failed. Try again.");
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a"); link.href = url; link.download = `hiatus-${period}-${date}.xlsx`; document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (failure) { setError((failure as Error).message); }
    finally { setPending(false); }
  }
  return <div className="flex max-w-sm flex-col gap-2">
    <Button variant="outline" disabled={!enabled || pending} loading={pending} onClick={download}>{pending ? "Preparing Excel…" : "Export Excel (.xlsx)"}</Button>
    {!enabled && <p className="text-sm text-muted">{enabled === null ? "Export settings could not load. Reload this page to try again." : "Excel exports are disabled. Enable them in Settings → API controls."}</p>}
    <FormError>{error}</FormError>
  </div>;
}

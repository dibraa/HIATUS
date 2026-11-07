"use client";
import { usePermissions } from "@/components/permission-controls";
import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TextField, TextAreaField, FormError, FormSuccess } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { formatPrice, formatDateTime } from "@/lib/format";
import type { Closeout, CloseoutInput } from "@/lib/reconciliation";
import { readCloseout, saveCloseout } from "@/app/actions/reconciliation";
const cents = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
function Difference({ value }: { value: number | null }) {
  return <span className={value === null ? "text-muted" : value === 0 ? "text-success" : "text-danger"}>{value === null ? "Not entered" : value === 0 ? "Balanced" : `${value > 0 ? "+" : "−"}${formatPrice(Math.abs(value))} · ${value > 0 ? "Over" : "Short"}`}</span>;
}
export function ReconciliationWorkspace({ initial, today }: { initial: Closeout; today: string }) {
  const { can } = usePermissions();
  const [data, setData] = useState(initial);
  const [opening, setOpening] = useState(initial.record?.opening_cash?.toString() ?? ""), [cash, setCash] = useState(initial.record?.counted_cash?.toString() ?? ""), [wallet, setWallet] = useState(initial.record?.actual_ewallet?.toString() ?? "");
  const [note, setNote] = useState(initial.record?.note || ""), [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null), [success, setSuccess] = useState<string | null>(null), [confirm, setConfirm] = useState<"finalize" | "revise" | null>(null);
  const [pending, start] = useTransition();
  const locked = data.record?.status === "finalized", snapshot = locked ? data.record?.snapshot : null;
  const expected = snapshot?.expected_cash ?? (opening === "" ? null : cents(Number(opening) + data.current.totals.cash.net));
  const walletLedger = snapshot || data.current;
  const hasWallet = walletLedger.has_ewallet ?? Object.values(walletLedger.totals.ewallet).some(value => value !== 0);
  const expectedWallet = snapshot?.totals.ewallet.net ?? data.current.totals.ewallet.net;
  const cashDifference = cash === "" || expected === null ? null : cents(Number(cash) - expected), walletDifference = !hasWallet ? 0 : wallet === "" ? null : cents(Number(wallet) - expectedWallet);
  const hasDifference = cashDifference !== null && cashDifference !== 0 || walletDifference !== null && walletDifference !== 0;
  const complete = [opening, cash, ...(hasWallet ? [wallet] : [])].every(value => value !== "" && Number.isFinite(Number(value)));
  function refresh() { setError(null);start(async () => { const result = await readCloseout(data.date);if(result.error)setError(result.error);else if(result.data){if(result.data.record?.status === "finalized" && result.data.record.version !== data.record?.version){setError("Another administrator finalized this closeout. Reload to inspect it; your draft is retained.");return;}setData(result.data);setSuccess("Totals refreshed. Your entered amounts are unchanged.");} }); }
  function save(action: CloseoutInput["action"]) {
    setConfirm(null);setError(null);setSuccess(null);
    start(async () => {
      const input: CloseoutInput = { version: data.record?.version || 0, action, opening_cash: opening === "" ? null : Number(opening), counted_cash: cash === "" ? null : Number(cash), actual_ewallet: !hasWallet ? 0 : wallet === "" ? null : Number(wallet), note, reason, fingerprint: data.current.fingerprint };
      const result = await saveCloseout(data.date, input);
      if(result.error)setError(result.error);else if(result.data){setData(result.data);setSuccess(action === "finalize" ? "Closeout finalized." : action === "revise" ? "Revision started. Previous versions are preserved." : "Draft saved.");setReason("");}
    });
  }
  return <fieldset disabled={!can("finance.reconcile")} className="closeout-workspace min-w-0">
    <div className="admin-panel mb-5"><form action="/admin/reports" className="flex flex-wrap items-end justify-between gap-4"><input type="hidden" name="view" value="reconciliation" /><div className="flex flex-wrap items-end gap-3"><TextField id="closeout-date" name="date" label="Date" type="date" required max={today} defaultValue={data.date} /><Button type="submit" variant="outline" disabled={pending}>View day</Button></div><span role="status" className="rounded-md bg-raised px-3 py-2 text-sm font-semibold">{data.needs_review ? "Needs review" : locked ? "Finalized" : "Draft"}</span></form></div>
    {data.needs_review && <p role="status" className="mb-5 rounded-md border border-warning-soft-fg p-4 text-sm">Transactions changed after finalization. Revise this closeout to review the new totals.</p>}
    {data.current.conflicts > 0 && <p role="alert" className="mb-5 rounded-md border border-danger p-4 text-sm text-danger">{data.current.conflicts} conflicting records block finalization. <Link href={`/admin/reports?view=transactions&period=daily&date=${data.date}`} className="underline">Review transactions</Link></p>}
    <section className="admin-panel" aria-labelledby="reconciliation-heading">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h2 id="reconciliation-heading" className="text-lg font-semibold">Daily closeout</h2><Button variant="ghost" disabled={pending} onClick={refresh}>Refresh totals</Button></div>
      <p className="mb-4 text-xs text-muted">Totals as of {formatDateTime(snapshot?.as_of || data.current.as_of)}{snapshot && ` · Finalized by ${snapshot.actor_name}`}</p>
      <form onSubmit={event => {event.preventDefault();setConfirm("finalize");}} className="flex flex-col gap-5">
        <div className="max-w-sm"><TextField id="opening-cash" label="Opening cash" type="number" inputMode="decimal" min="0" max="100000000" step="0.01" required value={opening} disabled={pending || locked} onChange={event => setOpening(event.target.value)} /></div>
        <div className="closeout-grid closeout-head" aria-hidden="true"><span>Method</span><span>Expected</span><span>Actual</span><span>Difference</span></div>
        <div className="closeout-grid"><h3 className="font-semibold">Cash</h3><div><span className="closeout-mobile-label">Expected</span><strong className={expected === null ? "font-normal text-muted" : "numeric"}>{expected === null ? "Not entered" : formatPrice(expected)}</strong></div><TextField id="counted-cash" label="Counted closing cash" type="number" inputMode="decimal" min="0" max="100000000" step="0.01" required value={cash} disabled={pending || locked} onChange={event => setCash(event.target.value)} /><div><span className="closeout-mobile-label">Difference</span><Difference value={cashDifference} /></div></div>
        {hasWallet && <div className="closeout-grid"><h3 className="font-semibold">Historical e-wallet</h3><div><span className="closeout-mobile-label">Expected</span><strong className="numeric">{formatPrice(expectedWallet)}</strong></div><TextField id="verified-ewallet" label="Verified net receipts" hint="Net receipts for this day, not the wallet balance." type="number" inputMode="decimal" min="-100000000" max="100000000" step="0.01" required value={wallet} disabled={pending || locked} onChange={event => setWallet(event.target.value)} /><div><span className="closeout-mobile-label">Difference</span><Difference value={walletDifference} /></div></div>}
        {(hasDifference || note) && <TextAreaField id="difference-note" label="Difference explanation" maxLength={2000} rows={3} required={hasDifference} value={note} disabled={pending || locked} onChange={event => setNote(event.target.value)} />}
        <FormError>{error}</FormError><FormSuccess>{success}</FormSuccess>
        {!locked && <div className="flex flex-wrap gap-3"><Button variant="outline" disabled={pending} loading={pending} onClick={() => save("draft")}>Save draft</Button><Button type="submit" disabled={pending || !complete || data.current.conflicts > 0 || (hasDifference && !note.trim())}>Finalize closeout</Button></div>}
      </form>
      {locked && <div className="mt-5 flex max-w-xl flex-col gap-3"><TextAreaField id="revision-reason" label="Revision reason" value={reason} maxLength={2000} rows={2} disabled={pending} onChange={event => setReason(event.target.value)} /><Button variant="outline" disabled={pending || !reason.trim()} onClick={() => setConfirm("revise")}>Revise closeout</Button></div>}
    </section>
    <details className="report-details admin-panel mt-5"><summary>Calculation details</summary><div className="report-detail-body text-sm"><p>Expected cash = opening cash + collections − refunds − paid voids. Staff shift floats are not added. Historical e-wallet records appear only when present.</p><div className="mt-4 grid gap-4 sm:grid-cols-2">{(["cash", ...(hasWallet ? ["ewallet" as const] : [])] as const).map(method => { const totals = snapshot?.totals[method] || data.current.totals[method];return <dl key={method}><dt className="font-semibold">{method === "cash" ? "Cash" : "E-wallet"}</dt><dd>Collections {formatPrice(totals.payments)}</dd><dd>Refunds {formatPrice(totals.refunds)}</dd><dd>Paid voids {formatPrice(totals.voids)}</dd><dd>Net {formatPrice(totals.net)}</dd></dl>;})}</div></div></details>
    <details className="report-details admin-panel mt-5"><summary>Closeout history</summary><div className="report-detail-body">{!data.record?.history.length ? <p className="text-sm text-muted">No finalized versions yet.</p> : <ol className="divide-y divide-line">{[...data.record.history].reverse().map(entry => <li className="py-4 text-sm" key={entry.version}><strong>Version {entry.version} · {entry.actor_name}</strong><p>{formatDateTime(entry.finalized_at)}</p><p>Cash: {formatPrice(entry.counted_cash)} · Difference: {formatPrice(entry.cash_difference)}</p>{(entry.has_ewallet || Object.values(entry.totals.ewallet).some(value => value !== 0) || entry.actual_ewallet !== 0) && <p>Historical e-wallet: {formatPrice(entry.actual_ewallet)} ; Difference: {formatPrice(entry.ewallet_difference)}</p>}{entry.note && <p className="mt-2 whitespace-pre-wrap wrap-anywhere">{entry.note}</p>}{entry.revision_reason && <p className="mt-2 whitespace-pre-wrap wrap-anywhere">Revision: {entry.revision_reason}</p>}</li>)}</ol>}</div></details>
    <Modal className="admin-report-dialog" open={confirm !== null} title={confirm === "revise" ? "Revise this closeout?" : "Finalize daily closeout?"} body={confirm === "revise" ? `Reason: ${reason}. Previous finalized versions remain in history.` : `Cash expected ${expected === null ? "not entered" : formatPrice(expected)}, counted ${formatPrice(Number(cash))}. ${hasWallet ? `Historical e-wallet expected ${formatPrice(expectedWallet)}, verified ${formatPrice(Number(wallet))}. E-wallet difference ${formatPrice(walletDifference || 0)}. ` : ""}Cash difference ${formatPrice(cashDifference || 0)}.${note ? ` Explanation: ${note}` : ""}`} confirmLabel={confirm === "revise" ? "Start revision" : "Finalize closeout"} onCancel={() => setConfirm(null)} onConfirm={() => save(confirm === "revise" ? "revise" : "finalize")} />
  </fieldset>;
}

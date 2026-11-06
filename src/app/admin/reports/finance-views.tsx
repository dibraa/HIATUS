"use client";
import { withPermission } from "@/components/permission-controls";
import { useId, useState, useTransition, Fragment, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { TextField, TextAreaField, SelectField, FormError } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { formatPrice, formatDateTime, orderCode } from "@/lib/format";
import { createDispute, updateDispute, refundFromReports, loadCustomerDetails } from "@/app/actions/finance";
import { caseStatus, financeLabel, type CustomerRow, type CustomerDetails, type LedgerEntry, type DisputeCase, type PeakHour } from "@/lib/finance";

export function HourChart({ data, title, description }: { data: PeakHour[]; title: string; description: string }) {
  const id = useId();
  const maximum = Math.max(0, ...data.map(row => row.order_count));
  const busiest = maximum ? data.filter(row => row.order_count === maximum).map(row => `${String(row.hour).padStart(2, "0")}:00`).join(", ") : "No orders yet";
  return <section className="admin-panel admin-report-section" aria-labelledby={id}>
    <h2 id={id} className="text-xl font-semibold">{title}</h2><p className="my-3 text-sm text-muted">{description}</p>
    <p className="mb-5 text-sm"><strong>Busiest:</strong> {busiest}{maximum > 0 && ` · ${maximum} order${maximum === 1 ? "" : "s"} per tied hour`}</p>
    <div className="report-hour-chart" aria-hidden="true">{data.map(row => <div key={row.hour} className="report-hour-column"><div className="report-hour-track"><span style={{ height: `${maximum ? row.order_count / maximum * 100 : 0}%` }} /></div><span>{String(row.hour).padStart(2, "0")}</span></div>)}</div>
    <ReportDetails label="View hourly counts"><div className="report-hour-counts">{data.map(row => <p key={row.hour}><span>{String(row.hour).padStart(2, "0")}:00</span><strong>{row.order_count}</strong></p>)}</div></ReportDetails>
  </section>;
}
export function ReportDetails({ label, children, initialOpen }: { label: string; children: ReactNode; initialOpen?: boolean }) {
  return <details open={initialOpen} className="report-details" onKeyDown={event => { event.currentTarget.dataset.instant = "true"; }} onPointerDown={event => { delete event.currentTarget.dataset.instant; }}><summary>{label}</summary><div className="report-detail-body">{children}</div></details>;
}
function RefundControlContent({ orderId, amount, pickupCode }: { orderId: string; amount: number; pickupCode?: string | null }) {
  const id = useId();
  const [reason, setReason] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  return <div className="mt-4">
    <form onSubmit={event => { event.preventDefault(); setConfirm(true); }} className="flex flex-col gap-3">
      <TextAreaField id={id} label="Full-refund reason" maxLength={280} required value={reason} onChange={event => setReason(event.target.value)} disabled={pending} rows={2} />
      <p className="text-sm text-muted">Return {formatPrice(amount)} by the original cash or e-wallet method, then record the refund.</p>
      <FormError>{error}</FormError><Button type="submit" variant="danger" disabled={pending || !reason.trim()} loading={pending}>Record full refund</Button>
      {error && <Button type="button" variant="ghost" onClick={() => router.refresh()}>Refresh order</Button>}
    </form>
    <Modal className="admin-report-dialog" open={confirm} title={`Refund ${orderCode(orderId, pickupCode)}?`} body={`Record a full refund of ${formatPrice(amount)}. Reason: ${reason.trim()}`} confirmLabel="Confirm full refund" danger onCancel={() => setConfirm(false)} onConfirm={() => {
      setConfirm(false); setError(null); start(async () => {
        const result = await refundFromReports(orderId, amount, reason.trim());
        if (result.error) setError(result.error); else { setReason(""); toast.success("Full refund recorded."); router.refresh(); }
      });
    }} />
  </div>;
}
export function TransactionTable({ items }: { items: LedgerEntry[] }) {
  if (!items.length) return <p className="admin-panel text-sm text-muted">No transactions match these filters.</p>;
  return <div className="admin-panel"><p className="report-table-hint">Scroll sideways for all columns and actions.</p><div className="admin-table-scroll" tabIndex={0} role="region" aria-label="Transactions">
    <table className="report-table"><thead><tr>{["Date", "Order / customer", "Staff", "Type", "Method", "Amount", "Details"].map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead><tbody>
      {items.map(item => <tr key={item._id}><td>{formatDateTime(item.created_at)}</td><td><strong>{orderCode(item.order_id, item.order_code)}</strong><span className="report-cell-secondary">{item.customer_name}</span></td><td>{item.staff_name}</td><td>{financeLabel(item.kind)}{item.conflict && <strong className="block text-danger">Needs review</strong>}</td><td>{item.method === "cash" ? "Cash" : "E-wallet"}</td><td className="numeric">{formatPrice(item.amount)}</td><td>
        <ReportDetails label={`Details ${orderCode(item.order_id, item.order_code)}`}><div className="report-record-detail">
          <dl><dt>Transaction ID</dt><dd>{item._id}</dd><dt>Full order ID</dt><dd>{item.order_id}</dd><dt>Source</dt><dd>{item.source === "embedded" ? "Current ledger" : "Legacy payment"}</dd><dt>Reference</dt><dd>{item.reference || "Not recorded"}</dd><dt>Reason</dt><dd>{item.reason || "Not recorded"}</dd></dl>
          {item.order && <div className="mt-3 flex flex-wrap gap-2"><Link className="admin-secondary-link" href={`/admin/orders/${item.order_id}/receipt`}>View receipt</Link><Link className="admin-secondary-link" href={`/admin/reports?view=refunds&period=all&order=${item.order_id}#disputes-heading`}>Open dispute for this order</Link></div>}
          {item.legacy_records.length > 0 && <div className="mt-4"><h3 className="font-semibold">Legacy source records</h3>{item.legacy_records.map(record => <p key={record._id} className="mt-2 text-sm">{record._id} · {record.method} · {formatPrice(record.amount)}{record.reason && ` · ${record.reason}`}</p>)}<p className="mt-2 text-sm text-muted">Matching legacy records are counted once.</p></div>}
          {item.kind === "payment" && item.order?.payment_status === "paid" && !item.conflict && <RefundControl pickupCode={item.order_code} orderId={item.order_id} amount={item.order.total_amount} />}
        </div></ReportDetails>
      </td></tr>)}
    </tbody></table>
  </div></div>;
}
export function CustomerTable({ items, period, date }: { items: CustomerRow[]; period: string; date: string }) {
  const [open, setOpen] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, CustomerDetails>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  function load(id: string, page = 1) {
    setError(null); start(async () => {
      const result = await loadCustomerDetails(id, period, date, page);
      if (result.error) setError(result.error); else if (result.data) setDetails(previous => ({ ...previous, [id]: result.data! }));
    });
  }
  if (!items.length) return <p className="admin-panel text-sm text-muted">No purchasing customers match these filters.</p>;
  return <div className="admin-panel"><div className="admin-table-scroll" tabIndex={0} role="region" aria-label="Customer analytics"><table className="report-table"><thead><tr>{["Customer", "Type", "Purchases", "Spend", "Last purchase", "Details"].map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead><tbody>
    {items.map(item => <Fragment key={item._id}><tr><td className="font-medium">{item.full_name || "Unnamed customer"}</td><td>{item.returning ? "Returning" : "New"}</td><td>{item.order_count}</td><td className="numeric">{formatPrice(item.total_spend)}</td><td>{formatDateTime(item.last_order_at)}</td><td><Button variant="ghost" aria-expanded={open === item._id} disabled={pending} onClick={() => { setOpen(open === item._id ? null : item._id); if (open !== item._id) load(item._id); }}>{open === item._id ? "Hide purchases" : "View purchases"}</Button></td></tr>
    {open === item._id && <tr><td colSpan={6}><div className="report-detail-body"><FormError>{error}</FormError>{pending && <p role="status">Loading purchases…</p>}{details[item._id] && <>
      <h3 className="font-semibold">Preferred items</h3><p className="my-3 text-sm">{details[item._id].preferred.map(row => `${row._id} (${row.quantity})`).join(", ") || "No items recorded."}</p>
      <ul>{details[item._id].orders.map(order => <li key={order._id} className="border-t border-line py-3 text-sm"><strong>{orderCode(order._id, order.pickup_code)}</strong> · {formatDateTime(order.created_at)} · {formatPrice(order.total_amount)}<p>{order.items.map(line => `${line.quantity} × ${line.item_name}`).join(", ")}</p></li>)}</ul>
      <div className="mt-3 flex flex-wrap items-center gap-3"><span className="text-sm text-muted">{details[item._id].total} purchases · Page {details[item._id].page}</span>{details[item._id].page > 1 && <Button variant="ghost" disabled={pending} onClick={() => load(item._id, details[item._id].page - 1)}>Previous purchases</Button>}{details[item._id].page * 20 < details[item._id].total && <Button variant="ghost" disabled={pending} onClick={() => load(item._id, details[item._id].page + 1)}>Next purchases</Button>}</div>
    </>}{error && <Button variant="ghost" disabled={pending} onClick={() => load(item._id)}>Try again</Button>}</div></td></tr>}</Fragment>)}
  </tbody></table></div></div>;
}
function NewDisputeContent({ initialOrder = "" }: { initialOrder?: string }) {
  const id = useId(), router = useRouter();
  const [order, setOrder] = useState(initialOrder), [issue, setIssue] = useState("");
  const [confirm, setConfirm] = useState(false), [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return <ReportDetails label="Open a dispute case" initialOpen={Boolean(initialOrder)}><form onSubmit={event => { event.preventDefault(); setConfirm(true); }} className="flex max-w-2xl flex-col gap-4">
    <TextField id={`${id}-order`} label="Order code or full order ID" required maxLength={25} value={order} disabled={pending} onChange={event => setOrder(event.target.value)} />
    <TextAreaField id={`${id}-issue`} label="Issue" required maxLength={2000} rows={3} value={issue} disabled={pending} onChange={event => setIssue(event.target.value)} />
    <FormError>{error}</FormError><Button type="submit" disabled={pending || !order.trim() || !issue.trim()} loading={pending}>Create case</Button>
    <Modal className="admin-report-dialog" open={confirm} title="Open this dispute case?" body={`Order ${order.trim()}. Issue preview: ${issue.trim().slice(0, 220)}${issue.trim().length > 220 ? "..." : ""}`} confirmLabel="Create case" onCancel={() => setConfirm(false)} onConfirm={() => { setConfirm(false); setError(null); start(async () => { const result = await createDispute(order, issue); if (result.error) setError(result.error); else { setOrder(""); setIssue(""); toast.success("Dispute case opened."); router.refresh(); } }); }} />
  </form></ReportDetails>;
}
function CaseActionsContent({ item }: { item: DisputeCase }) {
  const id = useId(), router = useRouter();
  const [kind, setKind] = useState("note"), [note, setNote] = useState(""), [outcome, setOutcome] = useState("no_refund");
  const [error, setError] = useState<string | null>(null), [confirm, setConfirm] = useState(false);
  const [pending, start] = useTransition();
  function save() { setConfirm(false); setError(null); start(async () => { const result = await updateDispute(item._id, item.version, kind, note, outcome); if (result.error) setError(result.error); else { setNote(""); setKind("note"); toast.success("Case updated."); router.refresh(); } }); }
  return <div className="mt-5 max-w-2xl"><form onSubmit={event => { event.preventDefault(); if (kind === "note") save(); else setConfirm(true); }} className="flex flex-col gap-3">
    <SelectField id={`${id}-action`} label="Case action" value={kind} disabled={pending} onChange={event => setKind(event.target.value)}><option value="note">Add note</option>{item.status === "open" && <option value="status">Start review</option>}{item.status !== "resolved" ? <option value="resolved">Resolve case</option> : <option value="reopened">Reopen case</option>}</SelectField>
    {kind === "resolved" && <SelectField id={`${id}-outcome`} label="Resolution outcome" value={outcome} disabled={pending} onChange={event => setOutcome(event.target.value)}><option value="refund_recorded">Refund recorded</option><option value="no_refund">No refund</option><option value="other">Other resolution</option></SelectField>}
    <TextAreaField id={`${id}-note`} label={kind === "resolved" ? "Resolution note" : kind === "reopened" ? "Reason for reopening" : "Note"} maxLength={2000} required rows={3} value={note} disabled={pending} onChange={event => setNote(event.target.value)} />
    <FormError>{error}</FormError><Button type="submit" disabled={pending || !note.trim()} loading={pending}>{kind === "note" ? "Save note" : "Review case update"}</Button>{error && <Button type="button" variant="ghost" onClick={() => router.refresh()}>Refresh case</Button>}
  </form><Modal className="admin-report-dialog" open={confirm} title="Confirm case update" body={`${kind === "resolved" ? `Resolve as ${financeLabel(outcome)}` : kind === "reopened" ? "Reopen this case" : "Start case review"}. Note preview: ${note.trim().slice(0, 220)}${note.trim().length > 220 ? "..." : ""}`} confirmLabel="Confirm update" onCancel={() => setConfirm(false)} onConfirm={save} /></div>;
}
export function DisputeList({ items }: { items: DisputeCase[] }) {
  if (!items.length) return <p className="py-4 text-sm text-muted">No dispute cases match these filters.</p>;
  return <div className="divide-y divide-line">{items.map(item => <div key={item._id} className="py-4">
    <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-semibold">Case {item._id.slice(-6).toUpperCase()} · {item.order_id ? `Order ${orderCode(item.order_id._id, item.order_id.pickup_code)}` : "Order unavailable"}</h3><span className="rounded-md bg-raised px-3 py-2 text-sm font-medium">{caseStatus[item.status]}</span></div>
    <p className="my-3 whitespace-pre-wrap break-words text-sm">{item.issue}</p><p className="text-xs text-muted">Opened {formatDateTime(item.created_at)}{item.outcome && ` · ${financeLabel(item.outcome)}`}</p>
    <ReportDetails label={`Case history and actions ${item._id.slice(-6).toUpperCase()}`}>
      <ol className="space-y-3">{item.events.map(event => <li key={event._id} className="border-t border-line pt-3"><p className="text-xs text-muted">{formatDateTime(event.created_at)} · {event.actor_name} · {financeLabel(event.kind)} · {caseStatus[event.status as keyof typeof caseStatus]}</p><p className="mt-2 whitespace-pre-wrap break-words text-sm">{event.note}</p>{event.outcome && <p className="mt-1 text-sm">{financeLabel(event.outcome)}</p>}</li>)}</ol>
      {item.order_id && <div className="mt-5"><Link href={`/admin/orders/${item.order_id._id}/receipt`} className="admin-secondary-link">Order payment records</Link>
        {item.refunds.map(record => <p key={record._id} className="mt-3 text-sm">{record.conflict ? "Refund needs review" : "Refund recorded"}: {formatPrice(record.amount)} · {formatDateTime(record.created_at)} · {record.reason}</p>)}
        {item.order_id.payment_status === "paid" && <RefundControl pickupCode={item.order_id.pickup_code} orderId={item.order_id._id} amount={item.order_id.total_amount} />}
      </div>}
      <CaseActions item={item} />
    </ReportDetails>
  </div>)}</div>;
}

export const RefundControl = withPermission("finance.refund", RefundControlContent);

export const NewDispute = withPermission("finance.disputes", NewDisputeContent);

const CaseActions = withPermission("finance.disputes", CaseActionsContent);

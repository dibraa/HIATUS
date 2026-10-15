"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import toast from "react-hot-toast";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import {
  advanceOrderStatus,
  flagSpecialRequest,
  notifyCustomerReady,
  prioritizeOrder,
  refundOrder,
  voidOrder,
} from "@/app/actions/staff";
import { formatPrice, orderCode } from "@/lib/format";
import { NEXT_STATUS, ORDER_TYPE_LABELS, STATUS_LABELS } from "@/lib/order-meta";
import { getSizeOption } from "@/lib/sizes";
import type { OrderStatus } from "@/types/database";
import { HandOverPanel } from "./hand-over-panel";
import type { QueueOrder } from "./order-ticket";

/**
 * The counter's one table: every open order, what it is, where it stands,
 * how long it has waited, whether it is paid, and the one button that moves
 * it on. Built against ui-ux-pro-max (rule ids in brackets):
 *
 *   - [content-jumping] orders that arrive after the page was loaded wait in
 *     a fixed-height INCOMING slot; they join the table only when the barista
 *     taps "Show", so a 15s refresh never moves a row under a finger.
 *   - [contextual-live-badge-updates] one polite announcer speaks a sentence
 *     ("1 new order: #3F2A9C from Jai R."), not a bare number.
 *   - [loading-buttons] a tapped row says what it is doing until the server
 *     answers; [color-not-only] late orders say "Late" / "Over …m".
 *   - Hierarchy: solid buttons only for Start and Hand over; Mark ready is
 *     outlined. Rare actions live behind a labelled ⋯ per row.
 *
 * Every action is one of the existing server actions in actions/staff.ts —
 * this file changes how the queue looks and flows, not what it does.
 */
type Props = {
  orders: QueueOrder[];
  /** Server time when the page rendered, so wait times match on hydration. */
  renderedAt: string;
  /** Minutes after which a ticket is "Late", and "Over …m". */
  lateAfter: number;
  overAfter: number;
  emptyTitle: string;
  emptyBody: string;
};

const STAGE: Record<string, { label: string; dot: string }> = {
  pending: { label: "New", dot: "bg-accent" },
  preparing: { label: "Making", dot: "bg-secondary" },
  ready: { label: "Ready", dot: "bg-ink" },
};

export function QueueBoard({ orders, renderedAt, lateAfter, overAfter, emptyTitle, emptyBody }: Props) {
  // Orders already on screen. Anything newer is held in the incoming slot.
  const [shown, setShown] = useState<Set<string>>(() => new Set(orders.map((o) => o.id)));
  const [handingOver, setHandingOver] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date(renderedAt).getTime());

  const visible = orders.filter((o) => shown.has(o.id));
  const incoming = orders.filter((o) => !shown.has(o.id));

  // Wait times tick every 30s after hydration (server time first, so the
  // "Late" flags render the same on both sides).
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, 30_000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, []);

  // One sentence for the polite live region; it is re-read only when the
  // incoming set changes, which is exactly when there is news.
  const announcement = incoming.length
    ? `${incoming.length} new ${incoming.length === 1 ? "order" : "orders"}: ${incoming
        .map((o) => `${orderCode(o.id)} from ${o.profiles?.full_name?.trim() || "a walk-in"}`)
        .join(", ")}.`
    : "";

  const handOverOrder = orders.find((o) => o.id === handingOver) ?? null;

  return (
    <div className={`grid items-start gap-4 ${handOverOrder ? "lg:grid-cols-[minmax(0,1fr)_22rem]" : ""}`}>
      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>

      <div className="min-w-0">
        {/* Incoming: always 56px tall, empty or not, so nothing below moves. */}
        <div
          className={`ui-caps mb-3 flex h-14 items-center gap-3 rounded-2xl px-4 pr-2 text-2xs ${
            incoming.length
              ? "border-2 border-accent bg-accent-soft text-accent-ink"
              : "border-2 border-dashed border-line-strong text-muted"
          }`}
        >
          {incoming.length ? (
            <>
              <span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-accent" />
              <span className="min-w-0 truncate">
                {incoming.length} new · {incoming.map((o) => orderCode(o.id)).join(" · ")}
              </span>
              <button
                type="button"
                onClick={() => setShown(new Set(orders.map((o) => o.id)))}
                className="ui-caps ml-auto min-h-11 shrink-0 rounded-xl bg-accent px-4 text-2xs text-accent-fg"
              >
                Show
              </button>
            </>
          ) : (
            <span>No new orders</span>
          )}
        </div>

        {visible.length === 0 ? (
          <EmptyState title={emptyTitle} body={emptyBody} />
        ) : (
          <>
            {/* Table from 900px; the same rows as cards below that. */}
            <div className="hidden rounded-2xl bg-card ring-1 ring-line min-[900px]:block">
              <table className="w-full border-separate border-spacing-0">
                <thead>
                  <tr className="eyebrow text-left text-muted">
                    {["Order", "Items", "Type", "Status", "Wait", "Payment"].map((h, i) => (
                      <th
                        key={h}
                        scope="col"
                        className={`sticky top-16 z-10 border-b border-line bg-raised px-3 py-2.5 font-medium ${i === 0 ? "rounded-tl-2xl" : ""} ${h === "Type" ? "max-xl:hidden" : ""}`}
                      >
                        {h}
                      </th>
                    ))}
                    <th scope="col" className="sticky top-16 z-10 rounded-tr-2xl border-b border-line bg-raised px-3 py-2.5">
                      <span className="sr-only">Next step</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((order) => (
                    <QueueRow
                      key={order.id}
                      order={order}
                      now={now}
                      lateAfter={lateAfter}
                      overAfter={overAfter}
                      selected={order.id === handingOver}
                      onHandOver={() => setHandingOver(order.id)}
                      layout="row"
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="grid gap-2.5 min-[900px]:hidden">
              {visible.map((order) => (
                <QueueRow
                  key={order.id}
                  order={order}
                  now={now}
                  lateAfter={lateAfter}
                  overAfter={overAfter}
                  selected={order.id === handingOver}
                  onHandOver={() => setHandingOver(order.id)}
                  layout="card"
                />
              ))}
            </ul>
          </>
        )}
      </div>

      {handOverOrder && <HandOverPanel order={handOverOrder} onClose={() => setHandingOver(null)} />}
    </div>
  );
}

function QueueRow({
  order,
  now,
  lateAfter,
  overAfter,
  selected,
  onHandOver,
  layout,
}: {
  order: QueueOrder;
  now: number;
  lateAfter: number;
  overAfter: number;
  selected: boolean;
  onHandOver: () => void;
  layout: "row" | "card";
}) {
  const [pending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState<"refund" | "void" | null>(null);

  const code = orderCode(order.id);
  const customer = order.profiles?.full_name?.trim() || "Walk-in";
  const minutes = Math.max(0, Math.floor((now - new Date(order.created_at).getTime()) / 60000));
  const waiting = order.status !== "ready";
  const isNew = order.status === "pending" && minutes < 2;
  const paid = order.payment_status === "paid";
  const type = `${ORDER_TYPE_LABELS[order.order_type]}${order.table_label ? ` · ${order.table_label}` : ""}`;
  const stage = STAGE[order.status];

  function run(fn: () => Promise<{ error: string | null }>, success: string) {
    startTransition(async () => {
      const { error } = await fn();
      if (error) toast.error(error);
      else toast.success(success);
    });
  }
  const advance = (to: OrderStatus) => run(() => advanceOrderStatus(order.id, to), `${code} → ${STATUS_LABELS[to]}`);

  const flags = (
    <div className="mt-1.5 flex flex-wrap gap-1.5">
      {isNew && <Chip tone="new">New</Chip>}
      {order.priority > 0 && <Chip tone="new">Priority</Chip>}
      {waiting && minutes >= overAfter && <Chip tone="over">Over {overAfter}m</Chip>}
      {waiting && minutes >= lateAfter && minutes < overAfter && <Chip tone="late">Late</Chip>}
    </div>
  );
  const items = (
    <div className="grid gap-0.5">
      {order.order_items.map((item) => (
        <span key={item.id} className="text-ink">
          <span className="numeric font-semibold">{item.quantity}×</span> {item.item_name}
          {item.size && <span className="text-xs text-muted"> · {getSizeOption(item.size).label}</span>}
        </span>
      ))}
      {(order.pickup_note || order.special_request_flag) && (
        <span className="mt-1 flex gap-1.5 text-xs text-warning-soft-fg">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="mt-px h-4 w-4 shrink-0 fill-none stroke-current" strokeWidth="2" strokeLinecap="round">
            <path d="M12 9v4M12 17h.01M10.3 3.9 2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
          </svg>
          {order.pickup_note || "Flagged for special handling"}
        </span>
      )}
    </div>
  );
  const payment = (
    <Chip tone={paid ? "paid" : "unpaid"}>{paid ? "Paid" : `Unpaid ${formatPrice(order.total_amount)}`}</Chip>
  );

  // The one button. Solid for Start and Hand over; Mark ready is outlined.
  const next = NEXT_STATUS[order.status];
  const base = "ui-caps inline-flex min-h-14 flex-1 items-center justify-center gap-2 rounded-xl px-3 text-2xs transition-colors disabled:cursor-progress disabled:opacity-70";
  const button =
    order.status === "pending" ? (
      <button type="button" disabled={pending} aria-busy={pending} onClick={() => advance("preparing")} className={`${base} bg-accent text-accent-fg hover:bg-accent-hover`}>
        {pending ? <><Spinner /> Starting…</> : "Start"}
      </button>
    ) : order.status === "preparing" ? (
      <button type="button" disabled={pending} aria-busy={pending} onClick={() => advance("ready")} className={`${base} border-2 border-secondary text-success-soft-fg hover:bg-success-soft-bg`}>
        {pending ? <><Spinner /> Marking ready…</> : "Mark ready"}
      </button>
    ) : next === "completed" ? (
      <button
        type="button"
        disabled={pending}
        aria-busy={pending}
        onClick={paid ? () => advance("completed") : onHandOver}
        className={`${base} bg-cta text-cta-fg hover:bg-cta-hover`}
      >
        {pending ? <><Spinner /> Handing over…</> : paid ? "Hand over" : `Take ${formatPrice(order.total_amount)} · hand over`}
      </button>
    ) : null;

  const menu = (
    <RowMenu label={`More actions for ${code}`}>
      {order.status === "pending" && (
        <MenuItem onClick={() => run(() => prioritizeOrder(order.id, !(order.priority > 0)), order.priority > 0 ? `${code} priority removed` : `${code} moved to the front`)}>
          {order.priority > 0 ? "Remove priority" : "Prioritize"}
        </MenuItem>
      )}
      <MenuItem onClick={() => run(() => flagSpecialRequest(order.id, !order.special_request_flag), order.special_request_flag ? `${code} flag removed` : `${code} flagged for special handling`)}>
        {order.special_request_flag ? "Unflag request" : "Flag request"}
      </MenuItem>
      {order.status === "ready" && (
        <MenuItem onClick={() => run(() => notifyCustomerReady(order.id), `${code} customer notified`)}>Notify customer again</MenuItem>
      )}
      <MenuLink href={`/staff/pos/receipt/${order.id}`}>Print receipt</MenuLink>
      <MenuLink href="/staff/menu">Mark an item sold out…</MenuLink>
      {paid && <MenuItem danger onClick={() => setConfirm("refund")}>Refund {formatPrice(order.total_amount)}…</MenuItem>}
      {(paid || order.payment_status === "unpaid") && <MenuItem danger onClick={() => setConfirm("void")}>Void transaction…</MenuItem>}
    </RowMenu>
  );

  const dialogs = (
    <>
      <Modal
        open={confirm === "refund"}
        title="Refund transaction"
        body={`Refund ${code} for ${formatPrice(order.total_amount)}? This marks the payment as refunded.`}
        confirmLabel="Refund transaction"
        danger
        onConfirm={() => {
          setConfirm(null);
          run(() => refundOrder(order.id, null, "refund issued by staff"), `${code} refund recorded`);
        }}
        onCancel={() => setConfirm(null)}
      />
      <Modal
        open={confirm === "void"}
        title="Void transaction"
        body={`Void ${code}? This cancels the order and reverses its transaction.`}
        confirmLabel="Void transaction"
        danger
        onConfirm={() => {
          setConfirm(null);
          run(() => voidOrder(order.id, "voided by staff"), `${code} transaction voided`);
        }}
        onCancel={() => setConfirm(null)}
      />
    </>
  );

  const wait = <span className="numeric text-sm text-ink">{minutes}m</span>;
  const stageLabel = (
    <span className="ui-caps inline-flex items-center gap-2 text-2xs text-ink">
      <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${stage.dot}`} />
      {stage.label}
    </span>
  );
  const identity = (
    <>
      <span className="display block text-2xl leading-none text-ink">{code}</span>
      <span className="mt-1 block text-sm font-semibold text-ink-soft">{customer}</span>
    </>
  );
  const freshEdge = isNew ? "shadow-[inset_4px_0_0_var(--hi-accent)]" : "";

  if (layout === "row") {
    const cell = `border-b border-line px-3 py-3 align-middle ${selected ? "bg-raised" : ""}`;
    return (
      <tr className="group/row [&:last-child>td]:border-b-0">
        <td className={`${cell} ${freshEdge}`}>{identity}</td>
        <td className={`${cell} text-sm`}>{items}</td>
        <td className={`${cell} max-xl:hidden`}>
          <Chip tone="type">{type}</Chip>
        </td>
        <td className={cell}>
          {stageLabel}
          {flags}
        </td>
        <td className={cell}>{wait}</td>
        <td className={cell}>{payment}</td>
        <td className={`${cell} w-64`}>
          <div className="flex gap-2">
            {button}
            {menu}
          </div>
          {dialogs}
        </td>
      </tr>
    );
  }

  return (
    <li className={`grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-2.5 rounded-2xl bg-card p-4 ring-1 ring-line ${freshEdge} ${selected ? "ring-2 ring-ink" : ""}`}>
      <div>{identity}</div>
      <div className="text-right">
        {wait}
        <div className="mt-1">{stageLabel}</div>
      </div>
      <div className="col-span-2 text-sm">{items}</div>
      <div className="col-span-2 flex flex-wrap items-center gap-1.5">
        <Chip tone="type">{type}</Chip>
        {payment}
        {flags}
      </div>
      <div className="col-span-2 flex gap-2">
        {button}
        {menu}
      </div>
      {dialogs}
    </li>
  );
}

const CHIP_TONES = {
  new: "bg-accent-soft text-accent-ink",
  late: "bg-warning-soft-bg text-warning-soft-fg",
  over: "bg-danger-soft-bg text-danger-soft-fg",
  paid: "bg-success-soft-bg text-success-soft-fg",
  unpaid: "bg-raised text-ink",
  type: "ring-1 ring-line-strong text-ink-soft",
};

function Chip({ tone, children }: { tone: keyof typeof CHIP_TONES; children: React.ReactNode }) {
  return <span className={`ui-caps inline-flex items-center whitespace-nowrap rounded-md px-2 py-1 text-[0.625rem] ${CHIP_TONES[tone]}`}>{children}</span>;
}

function Spinner() {
  return <span aria-hidden="true" className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent" />;
}

/** The ⋯ menu: a labelled 56px button; closes on Esc, outside click or choice. */
function RowMenu({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="grid h-14 w-14 place-items-center rounded-xl border border-line-strong text-ink hover:bg-raised"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
          <circle cx="5" cy="12" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="19" cy="12" r="1.8" />
        </svg>
      </button>
      {open && (
        <div role="menu" onClick={() => setOpen(false)} className="absolute right-0 top-[calc(100%+6px)] z-20 grid min-w-60 rounded-2xl bg-card p-1.5 ring-1 ring-line-strong">
          {children}
        </div>
      )}
    </div>
  );
}

function MenuItem({ children, onClick, danger }: { children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button type="button" role="menuitem" onClick={onClick} className={`min-h-12 rounded-xl px-3 text-left text-sm hover:bg-raised ${danger ? "text-danger" : "text-ink"}`}>
      {children}
    </button>
  );
}

function MenuLink({ children, href }: { children: React.ReactNode; href: string }) {
  return (
    <Link role="menuitem" href={href} className="flex min-h-12 items-center rounded-xl px-3 text-sm text-ink hover:bg-raised">
      {children}
    </Link>
  );
}

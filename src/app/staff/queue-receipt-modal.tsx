"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import {
  advanceOrderStatus,
  flagSpecialRequest,
  notifyCustomerReady,
  prioritizeOrder,
  refundOrder,
  voidOrder,
} from "@/app/actions/staff";
import { formatPrice, orderCode } from "@/lib/format";
import {
  NEXT_STATUS,
  ORDER_TYPE_LABELS,
  PAYMENT_STATUS_LABELS,
  STATUS_LABELS,
} from "@/lib/order-meta";
import { getSizeOption } from "@/lib/sizes";
import type { OrderStatus } from "@/types/database";
import type { QueueOrder } from "@/types/staff";

/**
 * Secondary actions for the selected ticket. Native dialog focus management
 * keeps keyboard users inside the receipt and restores focus on dismissal.
 */
export function QueueReceiptModal({
  order,
  now,
  lateAfter,
  overAfter,
  onClose,
  onHandOver,
}: {
  order: QueueOrder;
  now: number;
  lateAfter: number;
  overAfter: number;
  onClose: () => void;
  onHandOver: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState<"refund" | "void" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const code = orderCode(order.id);
  const customer = order.profiles?.full_name?.trim() || "Walk-in";
  const minutes = Math.max(
    0,
    Math.floor((now - new Date(order.created_at).getTime()) / 60000),
  );
  const paid = order.payment_status === "paid";
  const reversed =
    order.payment_status === "refunded" || order.payment_status === "voided";
  const waiting = order.status !== "ready";
  const over = waiting && minutes >= overAfter;
  const late = waiting && !over && minutes >= lateAfter;

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    closeRef.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = prev;
    };
  }, []);

  function run(
    fn: () => Promise<{ error: string | null }>,
    success: string,
    done?: () => void,
  ) {
    setError(null);
    startTransition(async () => {
      const { error } = await fn();
      if (error) {
        setError(error);
        toast.error(error);
      } else {
        toast.success(success);
        done?.();
      }
    });
  }
  const advance = (to: OrderStatus) =>
    run(
      () => advanceOrderStatus(order.id, to),
      `${code} to ${STATUS_LABELS[to]}`,
    );

  const next = NEXT_STATUS[order.status];
  const primary = reversed ? null : next === "completed" ? (
    <Button
      size="md"
      variant="primary"
      loading={pending}
      onClick={paid ? () => advance("completed") : onHandOver}
      aria-label={
        paid ? `Hand over order ${code}` : `Take payment for order ${code}`
      }
      className="min-h-12 w-full"
    >
      {pending ? "Working" : paid ? "Hand over" : "Take payment"}
    </Button>
  ) : next ? (
    <Button
      size="md"
      variant={order.status === "pending" ? "primary" : "outline"}
      loading={pending}
      onClick={() => advance(next)}
      aria-label={`${order.status === "pending" ? "Start" : "Mark ready"} order ${code}`}
      className="min-h-12 w-full"
    >
      {pending
        ? "Working"
        : order.status === "pending"
          ? "Start"
          : "Mark ready"}
    </Button>
  ) : null;

  const secondary =
    "ui-caps inline-flex min-h-11 items-center justify-center rounded-xl border border-line-strong px-3 text-2xs text-ink transition-colors hover:border-ink";
  const dangerBtn =
    "ui-caps inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-2xs transition-colors";

  return (
    <dialog
      ref={dialogRef}
      aria-label={`Actions for order ${code}`}
      onCancel={(e) => {
        e.preventDefault();
        if (!pending && !confirm) onClose();
      }}
      className="fixed inset-0 m-auto max-h-[88dvh] w-[calc(100%-2rem)] max-w-lg overflow-auto rounded-2xl border border-line-strong bg-card p-5 text-ink backdrop:bg-scrim sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget && !pending && !confirm) {
          const rect = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX < rect.left ||
            e.clientX > rect.right ||
            e.clientY < rect.top ||
            e.clientY > rect.bottom
          )
            onClose();
        }
      }}
    >
      <fieldset disabled={pending || !!confirm} className="grid min-w-0 gap-3">
        <legend className="sr-only">Order details and actions</legend>
        {error && (
          <p
            role="alert"
            className="rounded-md bg-danger-soft-bg p-3 text-sm text-danger-soft-fg"
          >
            {error}
          </p>
        )}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="display text-4xl leading-none text-ink">{code}</h2>
            <p className="mt-1.5 text-sm font-medium text-ink-soft">
              {customer} · {ORDER_TYPE_LABELS[order.order_type]}
              {order.table_label ? ` · ${order.table_label}` : ""}
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close receipt"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-line-strong text-ink transition-colors hover:bg-raised"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-5 w-5 fill-none stroke-current"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <span className="ui-caps rounded-full bg-raised px-2.5 py-1 text-2xs text-ink-soft">
            {minutes}m{over ? " over" : ""}
          </span>
          {over && (
            <span className="ui-caps rounded-full bg-danger-soft-bg px-2.5 py-1 text-2xs text-danger-soft-fg">
              Over {overAfter}m
            </span>
          )}
          {!over && late && (
            <span className="ui-caps rounded-full bg-warning-soft-bg px-2.5 py-1 text-2xs text-warning-soft-fg">
              Late
            </span>
          )}
          {order.priority > 0 && (
            <span className="ui-caps rounded-full bg-accent-soft px-2.5 py-1 text-2xs text-accent-ink">
              Priority
            </span>
          )}
          <span
            className={`ui-caps rounded-full px-2.5 py-1 text-2xs ${
              paid
                ? "bg-success-soft-bg text-success-soft-fg"
                : "bg-warning-soft-bg text-warning-soft-fg"
            }`}
          >
            {PAYMENT_STATUS_LABELS[order.payment_status]}
          </span>
        </div>

        {(order.pickup_note || order.special_request_flag) && (
          <p className="flex gap-2 rounded-xl bg-warning-soft-bg px-3.5 py-2.5 text-sm text-warning-soft-fg">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="mt-0.5 h-4 w-4 shrink-0 fill-none stroke-current"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M12 9v4M12 17h.01M10.3 3.9 2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
            </svg>
            <span>{order.pickup_note || "Flagged for special handling"}</span>
          </p>
        )}

        <ul className="grid gap-2">
          {order.order_items.map((item) => (
            <li
              key={item.id}
              className="flex items-baseline justify-between gap-3 text-[15px] text-ink"
            >
              <span className="min-w-0">
                <span className="numeric font-semibold">{item.quantity}x</span>{" "}
                {item.item_name}
              </span>
              {item.size && (
                <span className="shrink-0 text-xs text-muted">
                  {getSizeOption(item.size).label}
                </span>
              )}
            </li>
          ))}
        </ul>

        <div className="flex items-baseline justify-between border-t border-dashed border-line-strong pt-3">
          <span className="text-sm font-bold text-ink-soft">Total</span>
          <span className="numeric text-xl font-bold text-ink">
            {formatPrice(order.total_amount)}
          </span>
        </div>

        {primary}

        <div className="grid grid-cols-2 gap-2">
          {order.status === "pending" && (
            <button
              type="button"
              onClick={() =>
                run(
                  () => prioritizeOrder(order.id, !(order.priority > 0)),
                  order.priority > 0
                    ? `${code} priority removed`
                    : `${code} moved to front`,
                )
              }
              className={secondary}
            >
              {order.priority > 0 ? "Remove priority" : "Prioritize order"}
            </button>
          )}
          <button
            type="button"
            onClick={() =>
              run(
                () => flagSpecialRequest(order.id, !order.special_request_flag),
                order.special_request_flag
                  ? `${code} flag removed`
                  : `${code} flagged`,
              )
            }
            className={secondary}
          >
            {order.special_request_flag ? "Unflag request" : "Flag request"}
          </button>
          {order.status === "ready" && (
            <button
              type="button"
              onClick={() =>
                run(
                  () => notifyCustomerReady(order.id),
                  `${code} customer notified`,
                )
              }
              className={secondary}
            >
              Notify customer
            </button>
          )}
          {(paid || reversed) && (
            <Link
              href={`/staff/pos/receipt/${order.id}`}
              target="_blank"
              rel="noreferrer"
              className={secondary}
            >
              {paid ? "Issue receipt" : "Transaction record"}
            </Link>
          )}
        </div>

        {!reversed && (
          <div>
            <label
              htmlFor={`reversal-reason-${order.id}`}
              className="mb-1 block text-sm text-ink-soft"
            >
              Refund / void reason
            </label>
            <input
              id={`reversal-reason-${order.id}`}
              value={reason}
              maxLength={280}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-11 w-full rounded-md border border-line-strong px-3 text-sm"
              placeholder="Explain the correction before confirming"
            />
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <Link
            href="/staff/menu"
            className={`${dangerBtn} bg-warning-soft-bg text-warning-soft-fg hover:ring-1 hover:ring-warning`}
          >
            Mark item sold out
          </Link>
          {paid ? (
            <button
              type="button"
              onClick={() => setConfirm("refund")}
              disabled={!reason.trim()}
              className={`${dangerBtn} bg-danger-soft-bg text-danger hover:ring-1 hover:ring-danger`}
            >
              Refund
            </button>
          ) : !reversed && order.status !== "cancelled" ? (
            <button
              type="button"
              onClick={() => setConfirm("void")}
              disabled={!reason.trim()}
              className={`${dangerBtn} bg-danger-soft-bg text-danger hover:ring-1 hover:ring-danger`}
            >
              Void transaction
            </button>
          ) : null}
        </div>
      </fieldset>

      <Modal
        open={confirm === "refund"}
        title="Refund transaction"
        body={`Refund ${code} for ${formatPrice(order.total_amount)} via ${order.payment_method === "cash" ? "Cash" : "E-wallet"}? Reason: ${reason}`}
        confirmLabel="Refund transaction"
        danger
        onConfirm={() => {
          setConfirm(null);
          run(
            () => refundOrder(order.id, null, reason),
            `${code} refund recorded`,
            onClose,
          );
        }}
        onCancel={() => setConfirm(null)}
      />
      <Modal
        open={confirm === "void"}
        title="Void transaction"
        body={`Void ${code}? ${paid ? `Return ${formatPrice(order.total_amount)} via ${order.payment_method === "cash" ? "Cash" : "E-wallet"}.` : "Cancel this unpaid ticket; no money is returned."} Reason: ${reason}`}
        confirmLabel="Void transaction"
        danger
        onConfirm={() => {
          setConfirm(null);
          run(
            () => voidOrder(order.id, reason),
            `${code} transaction voided`,
            onClose,
          );
        }}
        onCancel={() => setConfirm(null)}
      />
    </dialog>
  );
}

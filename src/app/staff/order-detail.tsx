"use client";

import { useEffect, useRef, useTransition } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { AppToaster } from "@/components/app-toaster";
import { advanceOrderStatus } from "@/app/actions/staff";
import {
  NEXT_STATUS,
  ADVANCE_LABELS,
  ORDER_TYPE_LABELS,
} from "@/lib/order-meta";
import { orderCode } from "@/lib/format";
import type { QueueOrder } from "@/types/staff";
import { PaymentPanel, type PaymentThen } from "./pos/payment-panel";

/**
 * Focused payment for a ticket without leaving the three-lane counter.
 *
 * Customers pay before their drink is made, so an unpaid New order pays and
 * starts in one press, and an unpaid Ready order (the rare one that slipped
 * through) pays and hands over. A Making order only records the payment.
 */
export function OrderDetail({
  order,
  busy,
  onBusyChange,
  onClose,
  onDone,
  onDetails,
}: {
  order: QueueOrder;
  busy: boolean;
  onBusyChange: (busy: boolean) => void;
  onClose: () => void;
  /** Closes the dialog once the payment has gone through. */
  onDone: () => void;
  onDetails: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [pending, startTransition] = useTransition();
  const code = orderCode(order.id);
  const next = NEXT_STATUS[order.status];
  const unpaid = order.payment_status === "unpaid";
  const reversed =
    order.payment_status === "refunded" || order.payment_status === "voided";
  const then: PaymentThen | undefined =
    order.status === "pending"
      ? "preparing"
      : order.status === "ready"
        ? "completed"
        : undefined;
  const title = !unpaid
    ? "Order details"
    : then === "preparing"
      ? "Pay & start"
      : then === "completed"
        ? "Pay & hand over"
        : "Take payment";

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    el.showModal();
    return () => el.close();
  }, []);

  useEffect(() => {
    onBusyChange(pending);
  }, [pending, onBusyChange]);

  return (
    <dialog
      ref={dialog}
      aria-labelledby="selected-order-title"
      onCancel={(e) => {
        e.preventDefault();
        if (!busy && !pending) onClose();
      }}
      className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-1.5rem)] max-w-lg overflow-y-auto overscroll-contain rounded-2xl border border-line-strong bg-card p-4 text-ink backdrop:bg-scrim sm:p-6"
    >
      <div className="flex items-center justify-between gap-3 border-b border-line pb-3">
        <div className="min-w-0">
          <h2 id="selected-order-title" className="text-lg font-semibold">
            {title} <span className="text-ink-soft">· {code}</span>
          </h2>
          <p className="break-words text-sm text-ink-soft">
            {order.profiles?.full_name?.trim() || "Walk-in"} ·{" "}
            {ORDER_TYPE_LABELS[order.order_type]}
            {order.table_label ? ` · ${order.table_label}` : ""}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          disabled={busy || pending}
          onClick={onClose}
          aria-label="Close payment"
        >
          Close
        </Button>
      </div>
      {(order.pickup_note || order.special_request_flag) && (
        <p className="mt-3 rounded-md bg-warning-soft-bg p-3 text-sm text-warning-soft-fg">
          <strong>Order note: </strong>
          {order.pickup_note || "Flagged for special handling"}
        </p>
      )}
      <PaymentPanel
        key={`${order.id}:${order.total_amount}`}
        order={{
          ...order,
          subtotal_amount:
            order.subtotal_amount ?? order.total_amount + order.discount_amount,
          paid_at: order.paid_at ?? null,
        }}
        then={unpaid ? then : undefined}
        onBusyChange={onBusyChange}
        onDone={onDone}
      />
      <div className="grid gap-2 border-t border-line pt-4">
        {/* An unpaid order moves on through the payment button above; this
            one is only for an order that is already paid. */}
        {next && !reversed && !unpaid && (
          <Button
            loading={pending}
            disabled={busy}
            className="min-h-12 w-full"
            onClick={() => {
              startTransition(async () => {
                const { error } = await advanceOrderStatus(order.id, next);
                if (error) {
                  toast.error(error);
                } else {
                  toast.success(`${code} · ${ADVANCE_LABELS[order.status]}`);
                  onDone();
                }
              });
            }}
          >
            {ADVANCE_LABELS[order.status]}
          </Button>
        )}
        <Button variant="ghost" disabled={busy || pending} onClick={onDetails}>
          More order actions
        </Button>
      </div>
      <AppToaster inDialog />
    </dialog>
  );
}

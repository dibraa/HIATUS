"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { advanceOrderStatus } from "@/app/actions/staff";
import {
  NEXT_STATUS,
  ADVANCE_LABELS,
  ORDER_TYPE_LABELS,
} from "@/lib/order-meta";
import { orderCode } from "@/lib/format";
import type { QueueOrder } from "@/types/staff";
import { PaymentPanel } from "./pos/payment-panel";

/** Focused payment for a ticket without leaving the three-lane counter. */
export function OrderDetail({
  order,
  busy,
  onBusyChange,
  onClose,
  onDetails,
}: {
  order: QueueOrder;
  busy: boolean;
  onBusyChange: (busy: boolean) => void;
  onClose: () => void;
  onDetails: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const next = NEXT_STATUS[order.status];
  const reversed =
    order.payment_status === "refunded" || order.payment_status === "voided";

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
      className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-1.5rem)] max-w-lg overflow-y-auto overscroll-contain rounded-2xl border border-line-strong bg-card p-4 text-ink backdrop:bg-scrim sm:p-5"
    >
      <div className="flex items-center justify-between gap-2 border-b border-line pb-2">
        <h2 id="selected-order-title" className="text-lg font-semibold">
          {order.payment_status === "unpaid" ? "Take payment" : "Order details"}
        </h2>
        <Button
          variant="ghost"
          size="sm"
          disabled={busy || pending}
          onClick={onClose}
          aria-label="Close selected order"
        >
          Close
        </Button>
      </div>
      <p className="mt-3 text-sm text-ink-soft">
        {ORDER_TYPE_LABELS[order.order_type]}
        {order.table_label ? ` · ${order.table_label}` : ""}
      </p>
      {(order.pickup_note || order.special_request_flag) && (
        <p className="mt-2 rounded-md bg-warning-soft-bg p-3 text-sm text-warning-soft-fg">
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
        onBusyChange={onBusyChange}
      />
      <div className="grid gap-2 border-t border-line pt-4">
        {error && (
          <p
            role="alert"
            className="rounded-md bg-danger-soft-bg p-3 text-sm text-danger-soft-fg"
          >
            {error}
          </p>
        )}
        {next && !reversed && (
          <Button
            loading={pending}
            disabled={
              busy || (next === "completed" && order.payment_status !== "paid")
            }
            variant={order.payment_status === "unpaid" ? "outline" : "primary"}
            className="min-h-12 w-full"
            onClick={() => {
              startTransition(async () => {
                setError(null);
                const { error } = await advanceOrderStatus(order.id, next);
                if (error) {
                  setError(error);
                  toast.error(error);
                } else
                  toast.success(
                    `${orderCode(order.id)} · ${ADVANCE_LABELS[order.status]}`,
                  );
              });
            }}
          >
            {next === "completed" && order.payment_status !== "paid"
              ? "Payment required to hand over"
              : ADVANCE_LABELS[order.status]}
          </Button>
        )}
        <Button variant="ghost" disabled={busy || pending} onClick={onDetails}>
          More order actions
        </Button>
      </div>
    </dialog>
  );
}

"use client";

import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { formatElapsed, formatPrice, orderCode } from "@/lib/format";
import { getSizeOption } from "@/lib/sizes";
import {
  ADVANCE_LABELS,
  NEXT_STATUS,
  ORDER_TYPE_LABELS,
  STATUS_LABELS,
} from "@/lib/order-meta";
import { advanceOrderStatus, flagSpecialRequest, notifyCustomerReady, prioritizeOrder, refundOrder, voidOrder } from "@/app/actions/staff";
import { Modal } from "@/components/ui/modal";
import type { OrderItem, OrderStatus } from "@/types/database";

export type QueueOrder = {
  id: string;
  status: OrderStatus;
  order_type: "dine_in" | "takeout";
  table_label: string | null;
  priority: number;
  special_request_flag?: boolean;
  payment_method: "cash" | "ewallet";
  payment_status: "unpaid" | "paid" | "refunded" | "voided";
  total_amount: number;
  discount_amount: number;
  pickup_note: string | null;
  created_at: string;
  profiles: { full_name: string | null; phone: string | null } | null;
  order_items: OrderItem[];
};

/**
 * One ticket in the queue — distilled to what a barista needs:
 *
 *   - WHAT TO MAKE (items are the biggest text)
 *   - HOW LONG IT'S BEEN WAITING (elapsed time, always visible)
 *   - WHAT TO DO NEXT (one button, always bottom-right)
 *
 * The ticket is a card with a hairline border. The items are the dominant
 * element. Everything else recedes.
 */
export function OrderTicket({ order }: { order: QueueOrder }) {
  const [pending, startTransition] = useTransition();
  const [confirmRefund, setConfirmRefund] = useState(false);
  const [confirmVoid, setConfirmVoid] = useState(false);

  const next = NEXT_STATUS[order.status];
  const advanceLabel = ADVANCE_LABELS[order.status];
  const customer = order.profiles?.full_name?.trim() || "Walk-in";
  const isUrgent = order.priority > 0;
  const isFlagged = Boolean(order.special_request_flag);
  const hasSpecialRequest = Boolean(isFlagged || order.pickup_note);
  const cannotHandOver = next === "completed" && order.payment_status !== "paid";

  function run(fn: () => Promise<{ error: string | null }>, success: string) {
    startTransition(async () => {
      const { error } = await fn();
      if (error) toast.error(error);
      else toast.success(success);
    });
  }

  const elapsed = formatElapsed(order.created_at);

  return (
    <article className="py-4">
      {/* ---------- Top row: code + items + time + action ---------- */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="display text-base text-ink">
              {orderCode(order.id)}
            </span>
            {isUrgent && (
              <>
                <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-accent" />
                <span className="sr-only">Urgent</span>
              </>
            )}
            <Button
              size="sm"
              variant="ghost"
              disabled={pending}
              onClick={() =>
                run(
                  () => flagSpecialRequest(order.id, !isFlagged),
                  isFlagged ? `${orderCode(order.id)} flag removed` : `${orderCode(order.id)} flagged for special handling`
                )
              }
            >
              {pending ? "…" : isFlagged ? "Unflag request" : "Flag request"}
            </Button>
            <OrderStatusBadge status={order.status} />
            {hasSpecialRequest && (
              <span className="ui-caps rounded-sm bg-warning-soft-bg px-1.5 py-0.5 text-2xs text-warning-soft-fg">
                Special request
              </span>
            )}
          </div>
          <ul className="mt-1.5 flex flex-col gap-0.5">
            {order.order_items.map((item) => (
              <li key={item.id} className="flex items-baseline gap-2 text-lg text-ink">
                <span className="font-semibold text-accent-ink">
                  {item.quantity}&times;
                </span>
                <span>{item.item_name}</span>
                {item.size && (
                  <span className="text-sm text-muted">{getSizeOption(item.size).label}</span>
                )}
              </li>
            ))}
          </ul>
          {order.pickup_note && (
            <p className="mt-2 rounded-md border border-warning-soft-fg/30 bg-warning-soft-bg px-3 py-2 text-xs text-warning-soft-fg">
              <span className="font-semibold">Customer request:</span>{" "}
              {order.pickup_note}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          <span
            className="font-mono text-xs text-muted"
            suppressHydrationWarning
          >
            {elapsed}
          </span>
          {next && advanceLabel && (
            <Button
              size="sm"
              disabled={pending || cannotHandOver}
              onClick={() =>
                run(
                  () => advanceOrderStatus(order.id, next),
                  `${orderCode(order.id)} → ${STATUS_LABELS[next]}`
                )
              }
            >
              {pending ? "…" : advanceLabel}
            </Button>
          )}
          {order.status === "ready" && (
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() =>
                run(
                  () => notifyCustomerReady(order.id),
                  `${orderCode(order.id)} customer notified`
                )
              }
            >
              {pending ? "…" : "Notify customer"}
            </Button>
          )}
          {order.status === "pending" && (
            <Button
              size="sm"
              variant="ghost"
              disabled={pending}
              onClick={() =>
                run(
                  () => prioritizeOrder(order.id, !isUrgent),
                  isUrgent ? `${orderCode(order.id)} priority removed` : `${orderCode(order.id)} moved to the front`
                )
              }
            >
              {pending ? "…" : isUrgent ? "Remove priority" : "Prioritize"}
            </Button>
          )}
          {cannotHandOver && (
            <span className="text-xs font-medium text-warning-soft-fg">Pay first</span>
          )}
        </div>
      </div>

      {(order.payment_status === "paid" || order.payment_status === "unpaid") && (
        <div className="mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-line pt-3">
          {order.payment_status === "paid" && (
            <button
              type="button"
              disabled={pending}
              onClick={() => setConfirmRefund(true)}
              className="text-xs text-danger underline underline-offset-2 transition-colors hover:text-danger/80 disabled:opacity-50"
            >
              Refund {formatPrice(order.total_amount)}
            </button>
          )}
          <button
            type="button"
            disabled={pending}
            onClick={() => setConfirmVoid(true)}
            className="text-xs text-danger underline underline-offset-2 transition-colors hover:text-danger/80 disabled:opacity-50"
          >
            Void transaction
          </button>
        </div>
      )}

      <div className="mt-2 flex justify-end">
        <div className="flex flex-wrap justify-end gap-3 text-xs text-muted">
          <a href="/staff/shift" className="underline underline-offset-2 transition-colors hover:text-ink">
            Manage my shift
          </a>
          <a href="/staff/menu" className="underline underline-offset-2 transition-colors hover:text-ink">
            Manage item availability
          </a>
        </div>
      </div>

      <Modal
        open={confirmRefund}
        title="Refund transaction"
        body={`Refund ${orderCode(order.id)} for ${formatPrice(order.total_amount)}? This marks the payment as refunded.`}
        confirmLabel="Refund transaction"
        cancelLabel="Cancel"
        danger
        onConfirm={() => {
          setConfirmRefund(false);
          run(() => refundOrder(order.id, null, "refund issued by staff"), `${orderCode(order.id)} refund recorded`);
        }}
        onCancel={() => setConfirmRefund(false)}
      />

      <Modal
        open={confirmVoid}
        title="Void transaction"
        body={`Void ${orderCode(order.id)}? This cancels the order and reverses its transaction.`}
        confirmLabel="Void transaction"
        cancelLabel="Cancel"
        danger
        onConfirm={() => {
          setConfirmVoid(false);
          run(() => voidOrder(order.id, "voided by staff"), `${orderCode(order.id)} transaction voided`);
        }}
        onCancel={() => setConfirmVoid(false)}
      />

      {/* ---------- Bottom row: customer + type ---------- */}
      <div className="mt-2 flex items-baseline gap-2 text-xs text-muted">
        <span>{customer}</span>
        <span aria-hidden="true">&middot;</span>
        <span>{ORDER_TYPE_LABELS[order.order_type]}</span>
        {order.table_label && (
          <>
            <span aria-hidden="true">&middot;</span>
            <span>{order.table_label}</span>
          </>
        )}
      </div>
    </article>
  );
}

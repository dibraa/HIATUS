"use client";

import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import {
  advanceOrderStatus,
  notifyCustomerReady,
  prioritizeOrder,
} from "@/app/actions/staff";
import { formatPrice, orderCode } from "@/lib/format";
import {
  ADVANCE_LABELS,
  NEXT_STATUS,
  ORDER_TYPE_LABELS,
  PAYMENT_STATUS_LABELS,
  STATUS_LABELS,
} from "@/lib/order-meta";
import { getSizeOption } from "@/lib/sizes";
import type { QueueOrder } from "@/types/staff";

export function QueueCard({
  order,
  now,
  lateAfter,
  overAfter,
  disabled,
  onPayment,
  onMore,
}: {
  order: QueueOrder;
  now: number;
  lateAfter: number;
  overAfter: number;
  disabled?: boolean;
  onPayment: () => void;
  onMore: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const code = orderCode(order.id);
  const minutes = Math.max(
    0,
    Math.floor((now - new Date(order.created_at).getTime()) / 60000),
  );
  const paid = order.payment_status === "paid";
  const unpaid =
    order.payment_status === "unpaid" && order.status !== "cancelled";
  const reversed =
    order.payment_status === "refunded" || order.payment_status === "voided";
  const next = !reversed ? NEXT_STATUS[order.status] : undefined;
  const waiting = order.status === "pending" || order.status === "preparing";
  async function run(
    action: () => Promise<{ error: string | null }>,
    success: string,
  ) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
      } else toast.success(success);
    });
  }
  return (
    <article className="counter-ticket" aria-label={`Order ${code}`}>
      <div className="counter-ticket-heading">
        <h3 className="display">{code}</h3>
        <span
          className={`numeric ${waiting && minutes >= lateAfter ? "text-warning" : "text-muted"}`}
          aria-label={`Waiting ${minutes} minutes`}
        >
          {minutes}m{waiting && minutes >= overAfter ? " · Overdue" : ""}
        </span>
      </div>
      <p className="counter-ticket-customer">
        {order.profiles?.full_name?.trim() || "Walk-in"} ·{" "}
        {ORDER_TYPE_LABELS[order.order_type]}
        {order.table_label ? ` · ${order.table_label}` : ""}
      </p>
      <div className="counter-ticket-badges">
        <span
          className={`ui-caps counter-ticket-badge ${paid ? "bg-success-soft-bg text-success-soft-fg" : "bg-warning-soft-bg text-warning-soft-fg"}`}
        >
          {order.status === "cancelled" && order.payment_status === "unpaid"
            ? "Cancelled"
            : PAYMENT_STATUS_LABELS[order.payment_status]}
        </span>
        {order.priority > 0 && (
          <span className="ui-caps counter-ticket-badge bg-warning-soft-bg text-warning-soft-fg">
            Priority
          </span>
        )}
        {order.special_request_flag && (
          <span className="ui-caps counter-ticket-badge bg-warning-soft-bg text-warning-soft-fg">
            Special request
          </span>
        )}
        {!next && order.status !== "cancelled" && (
          <span className="ui-caps counter-ticket-badge bg-raised text-ink-soft">
            {STATUS_LABELS[order.status]}
          </span>
        )}
      </div>
      <ul className="counter-ticket-items">
        {order.order_items.map((item) => (
          <li key={item.id}>
            <span className="numeric counter-item-quantity">
              {item.quantity}×
            </span>
            <div>
              <strong>{item.item_name}</strong>
              {(item.size || item.flavor) && (
                <p>
                  {[
                    item.size ? getSizeOption(item.size).label : null,
                    item.flavor,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
            </div>
          </li>
        ))}
      </ul>
      {(order.pickup_note || order.special_request_flag) && (
        <div className="counter-customer-request">
          <strong>Customer request</strong>
          <p>
            {order.pickup_note ||
              "Flagged for special handling. Check with the customer."}
          </p>
        </div>
      )}
      <div className="counter-ticket-total">
        <span>Order total</span>
        <strong className="numeric">{formatPrice(order.total_amount)}</strong>
      </div>
      {error && (
        <p
          role="alert"
          className="mb-3 rounded-md bg-danger-soft-bg p-3 text-sm text-danger-soft-fg"
        >
          {error}
        </p>
      )}
      <div className="counter-ticket-actions">
        {next && (
          <Button
            className="w-full"
            loading={pending}
            disabled={disabled || (next === "completed" && !paid)}
            onClick={() =>
              run(
                () => advanceOrderStatus(order.id, next),
                `${code} · ${STATUS_LABELS[next]}`,
              )
            }
          >
            {ADVANCE_LABELS[order.status]}
          </Button>
        )}
        {unpaid && (
          <Button
            className="w-full"
            variant={order.status === "ready" ? "primary" : "outline"}
            disabled={disabled || pending}
            onClick={onPayment}
          >
            Take payment
          </Button>
        )}
      </div>
      {order.status === "ready" && unpaid && (
        <p className="counter-payment-hint">
          Payment must be confirmed before handover.
        </p>
      )}
      <div className="counter-ticket-links">
        {order.status === "pending" && !reversed && (
          <>
            <button
              type="button"
              disabled={disabled || pending}
              onClick={() =>
                run(
                  () => prioritizeOrder(order.id, true),
                  `${code} moved to the front`,
                )
              }
            >
              Move to front
            </button>
            {order.priority > 0 && (
              <button
                type="button"
                disabled={disabled || pending}
                onClick={() =>
                  run(
                    () => prioritizeOrder(order.id, false),
                    `${code} priority removed`,
                  )
                }
              >
                Remove priority
              </button>
            )}
          </>
        )}
        <button type="button" disabled={disabled || pending} onClick={onMore}>
          More actions
        </button>
        {(paid || reversed) && (
          <a
            href={`/staff/pos/receipt/${order.id}`}
            target="_blank"
            rel="noreferrer"
          >
            {reversed ? "Transaction record" : "Receipt"}{" "}
            <span aria-hidden="true">↗</span>
          </a>
        )}
        {order.status === "ready" && (
          <button
            type="button"
            disabled={disabled || pending}
            onClick={() =>
              run(
                () => notifyCustomerReady(order.id),
                `${code} · customer notified`,
              )
            }
          >
            Notify customer
          </button>
        )}
      </div>
    </article>
  );
}

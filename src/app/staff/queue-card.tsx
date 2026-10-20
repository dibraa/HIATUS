"use client";

import { useTransition } from "react";
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

/**
 * One order on the counter. Every ticket is the same height (see staff.css):
 * header, a reserved tag row, the items, and a footer pinned to the bottom.
 * A ticket with more than two items shows the first and "+N more items",
 * which opens the full order, so nothing is cut off silently.
 */
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
  const code = orderCode(order.id);
  const minutes = Math.max(
    0,
    Math.floor((now - new Date(order.created_at).getTime()) / 60000),
  );
  const unpaid =
    order.payment_status === "unpaid" && order.status !== "cancelled";
  const reversed =
    order.payment_status === "refunded" || order.payment_status === "voided";
  const next = !reversed ? NEXT_STATUS[order.status] : undefined;
  const waiting = order.status === "pending" || order.status === "preparing";
  // Amber is reserved for this one state, so it stays readable at a glance.
  const late = waiting && minutes >= lateAfter;
  const overdue = waiting && minutes >= overAfter;
  // Customers pay before their drink is made, so an unpaid New order's next
  // step IS payment ("Pay & start"); an unpaid Ready order, the rare one that
  // slipped through, pays and hands over in the same press.
  const payFirst =
    unpaid && (order.status === "pending" || order.status === "ready");
  const payLabel = order.status === "pending" ? "Pay & start" : "Pay & hand over";
  const shown = order.order_items.length > 2
    ? order.order_items.slice(0, 1)
    : order.order_items;
  const hidden = order.order_items.length - shown.length;
  // "Not paid" only where it is the exception. In New, unpaid is the normal
  // state and the "Pay & start" button already says so.
  const tags = [
    unpaid && order.status !== "pending" && "Not paid",
    reversed && PAYMENT_STATUS_LABELS[order.payment_status],
    order.status === "cancelled" && "Cancelled",
    order.priority > 0 && "Priority",
  ].filter((tag): tag is string => Boolean(tag));

  async function run(
    action: () => Promise<{ error: string | null }>,
    success: string,
  ) {
    // Failures show as a pop-up only; the ticket keeps its fixed layout.
    startTransition(async () => {
      const result = await action();
      if (result.error) toast.error(result.error);
      else toast.success(success);
    });
  }

  // One contextual link beside "More actions", so the row never wraps.
  let link: { label: string; onClick: () => void } | null = null;
  if (unpaid && order.status === "preparing")
    link = { label: "Take payment", onClick: onPayment };
  else if (order.status === "pending" && !reversed)
    link =
      order.priority > 0
        ? {
            label: "Remove priority",
            onClick: () =>
              run(
                () => prioritizeOrder(order.id, false),
                `${code} priority removed`,
              ),
          }
        : {
            label: "Move to front",
            onClick: () =>
              run(
                () => prioritizeOrder(order.id, true),
                `${code} moved to the front`,
              ),
          };
  else if (order.status === "ready")
    link = {
      label: "Notify customer",
      onClick: () =>
        run(
          () => notifyCustomerReady(order.id),
          `${code} · customer notified`,
        ),
    };

  return (
    <article
      className={`counter-ticket ticket-edges${late ? " is-late" : ""}`}
      aria-label={`Order ${code}, waiting ${minutes} minutes${late ? ", late" : ""}`}
    >
      <div className="counter-ticket-top">
        <div className="counter-ticket-id">
          <h3 className="display">{code}</h3>
          <p
            title={order.profiles?.full_name?.trim() || "Walk-in"}
          >
            {order.profiles?.full_name?.trim() || "Walk-in"} ·{" "}
            {ORDER_TYPE_LABELS[order.order_type]}
            {order.table_label ? ` · ${order.table_label}` : ""}
          </p>
        </div>
        <p className="counter-wait">
          <b>{minutes}</b>
          <span>
            min{late ? (overdue ? " · Overdue" : " · Late") : ""}
          </span>
        </p>
      </div>

      <div className="counter-ticket-tags">
        {tags.map((tag) => (
          <span key={tag} className="counter-tag">
            {tag}
          </span>
        ))}
      </div>

      <div className="counter-ticket-body">
        <ul className="counter-ticket-items">
          {shown.map((item) => (
            <li key={item.id}>
              <span
                className={`counter-q${item.quantity > 1 ? " is-many" : ""}`}
              >
                {item.quantity}×
              </span>
              <div>
                <strong title={item.item_name}>{item.item_name}</strong>
                {(item.size || item.flavor) && (
                  <small>
                    {[
                      item.size ? getSizeOption(item.size).label : null,
                      item.flavor,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </small>
                )}
              </div>
            </li>
          ))}
        </ul>
        {hidden > 0 && (
          <button
            type="button"
            className="counter-more-items"
            disabled={disabled || pending}
            onClick={onMore}
          >
            +{hidden} more {hidden === 1 ? "item" : "items"}
          </button>
        )}
        {(order.pickup_note || order.special_request_flag) && (
          <div className="counter-customer-request">
            <strong>Customer request</strong>
            <p>
              {order.pickup_note ||
                "Flagged for special handling. Check with the customer."}
            </p>
          </div>
        )}
      </div>

      <div className="counter-ticket-foot">
        <div className="counter-ticket-total">
          <span>Order total</span>
          <strong className="numeric">{formatPrice(order.total_amount)}</strong>
        </div>
        {payFirst ? (
          <Button
            className="counter-go"
            disabled={disabled || pending}
            onClick={onPayment}
          >
            {payLabel}
          </Button>
        ) : next ? (
          <Button
            className="counter-go"
            loading={pending}
            disabled={disabled}
            onClick={() =>
              run(
                () => advanceOrderStatus(order.id, next),
                `${code} · ${STATUS_LABELS[next]}`,
              )
            }
          >
            {ADVANCE_LABELS[order.status]}
          </Button>
        ) : (
          <p className="counter-ticket-state">{STATUS_LABELS[order.status]}</p>
        )}
        <div className="counter-ticket-links">
          {link && (
            <button
              type="button"
              disabled={disabled || pending}
              onClick={link.onClick}
            >
              {link.label}
            </button>
          )}
          <button
            type="button"
            className="counter-ticket-more"
            disabled={disabled || pending}
            onClick={onMore}
          >
            More actions
          </button>
        </div>
      </div>
    </article>
  );
}

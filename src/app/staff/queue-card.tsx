"use client";
import { usePermissions } from "@/components/permission-controls";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import {
  advanceOrderStatus,
  notifyCustomerReady,
  prioritizeOrder,
  takePayment,
} from "@/app/actions/staff";
import { cashReference } from "@/lib/cash";
import { formatPrice, formatTime, orderCode } from "@/lib/format";
import {
  ADVANCE_LABELS,
  NEXT_STATUS,
  ORDER_TYPE_LABELS,
  PAYMENT_STATUS_LABELS,
  STATUS_LABELS,
} from "@/lib/order-meta";
import { servingLabel } from "@/lib/sizes";
import type { QueueOrder } from "@/types/staff";
import { CashButtons, CashKeypad, CashKeypadActions } from "./cash-keypad";

/** Seconds a cash tap waits before it is recorded, so a mis-tap can be undone. */
const HOLD_SECONDS = 5;
/** Minutes a paid Ready order waits for pickup before it clears to History. */
export const READY_CLEARS_AFTER = 10;

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
  const { can } = usePermissions();
  const [pending, startTransition] = useTransition();
  const code = orderCode(order.id, order.pickup_code);
  const minutes = Math.max(
    0,
    Math.floor((now - new Date(order.created_at).getTime()) / 60000),
  );
  const unpaid =
    order.payment_status === "unpaid" && order.status !== "cancelled";
  const reversed =
    order.payment_status === "refunded" || order.payment_status === "voided";
  // Ready has no button: the order clears itself, or "Picked up" clears it early.
  const next = !reversed && can("counter.prepare") && order.status !== "ready" ? NEXT_STATUS[order.status] : undefined;
  const waiting = order.status === "pending" || order.status === "preparing";
  // Amber is reserved for this one state, so it stays readable at a glance.
  const late = waiting && minutes >= lateAfter;
  const overdue = waiting && minutes >= overAfter;
  // Customers pay at the counter before their drink is made, so an unpaid New
  // order's next step IS payment: one cash tap records it and starts making.
  // An unpaid Ready order, the rare one that slipped through, pays and is
  // handed over in the same tap.
  const payFirst =
    can("counter.payment") && unpaid && (order.status === "pending" || order.status === "ready");
  const [keypad, setKeypad] = useState(false);
  const [typed, setTyped] = useState("");
  /** A cash tap waiting out its undo window; `left` counts down to recording. */
  const [held, setHeld] = useState<{ cash: number; left: number } | null>(null);
  const heldRef = useRef(held);
  const recording = useRef(false);
  const closeKeypad = useCallback(() => { setKeypad(false); setTyped(""); }, []);
  const paidLine = order.status === "preparing" && order.payment_status === "paid"
    ? order.transactions?.findLast((entry) => entry.kind === "payment")?.reference
    : null;
  const shown = order.order_items.length > 2
    ? order.order_items.slice(0, 1)
    : order.order_items;
  const hidden = order.order_items.length - shown.length;
  // "Not paid" only where it is the exception. In New, unpaid is the normal
  // state and the "Pay & start" button already says so.
  const tags = [
    paidLine?.startsWith("Cash ") && paidLine,
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

  /** Records the cash, then carries the order on: New starts making, Ready is handed over. */
  async function record(cash: number): Promise<{ error: string | null }> {
    const total = Math.round(order.total_amount * 100) / 100;
    const paid = await takePayment(order.id, "cash", total, cashReference(cash, total));
    if (paid.error) return paid;
    if (!can("counter.prepare")) return { error: null };
    const moved = await advanceOrderStatus(order.id, order.status === "pending" ? "preparing" : "completed");
    return moved.error ? { error: `${formatPrice(cash)} cash is recorded, but ${code} couldn't move on: ${moved.error}` } : { error: null };
  }

  function commit(cash: number) {
    recording.current = true;
    startTransition(async () => {
      try {
        const result = await record(cash);
        if (result.error) toast.error(result.error);
        else toast.success(`${code} · paid ${formatPrice(cash)} · change ${formatPrice(cash - order.total_amount)}`);
      } catch {
        toast.error("Couldn't record the payment. Refresh the order before trying again.");
      } finally {
        recording.current = false;
        setHeld(null);
      }
    });
  }

  function pick(cash: number) {
    closeKeypad();
    setHeld({ cash, left: HOLD_SECONDS });
  }

  // Count the undo window down; at zero the payment is recorded.
  useEffect(() => {
    heldRef.current = held;
    if (!held || recording.current) return;
    if (held.left <= 0) return commit(held.cash);
    const timer = setTimeout(() => setHeld((h) => h && { ...h, left: h.left - 1 }), 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- commit reads the current order on purpose.
  }, [held]);

  // Leaving the counter mid-countdown still records the cash that was taken.
  useEffect(() => () => {
    if (heldRef.current && !recording.current) void record(heldRef.current.cash);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- unmount only.
  }, []);

  // Contextual links beside "More actions"; Ready has two, both short, so the row still fits.
  const links: { label: string; onClick: () => void }[] = [];
  let link: { label: string; onClick: () => void } | null = null;
  if (unpaid && order.status === "preparing" && can("counter.payment"))
    link = { label: "Take payment", onClick: onPayment };
  else if (order.status === "pending" && !reversed && can("counter.prepare"))
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
  else if (order.status === "ready" && can("counter.prepare")) {
    if (!unpaid && !reversed)
      links.push({
        label: "Picked up",
        onClick: () =>
          run(
            () => advanceOrderStatus(order.id, "completed"),
            `${code} · picked up`,
          ),
      });
    link = {
      label: "Notify customer",
      onClick: () =>
        run(
          () => notifyCustomerReady(order.id),
          `${code} · customer notified`,
        ),
    };
  }
  if (link) links.push(link);
  const clearsAt =
    order.status === "ready" && order.ready_at && !unpaid
      ? formatTime(new Date(new Date(order.ready_at).getTime() + READY_CLEARS_AFTER * 60000))
      : null;

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

      {keypad ? (
        <div className="counter-ticket-body">
          <CashKeypad
            total={order.total_amount}
            value={typed}
            onChange={setTyped}
            onSubmit={pick}
            onClose={closeKeypad}
          />
        </div>
      ) : (
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
                      item.size ? servingLabel(item, item.size) : null,
                      item.item_type !== "food" ? item.flavor : null,
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
      )}

      <div className="counter-ticket-foot">
        {!keypad && (
          <div className="counter-ticket-total">
            <span>Order total</span>
            <strong className="numeric">{formatPrice(order.total_amount)}</strong>
          </div>
        )}
        {held ? (
          <div className="counter-held" role="status">
            <p>
              Cash {formatPrice(held.cash)} · <b>change {formatPrice(held.cash - order.total_amount)}</b>
            </p>
            <Button
              variant="outline"
              className="counter-go"
              loading={pending}
              disabled={held.left <= 0}
              onClick={() => setHeld(null)}
            >
              {held.left > 0 ? `Undo · ${held.left}s` : "Recording…"}
            </Button>
          </div>
        ) : keypad ? (
          <CashKeypadActions
            total={order.total_amount}
            value={typed}
            onSubmit={pick}
            onClose={closeKeypad}
          />
        ) : payFirst ? (
          <CashButtons
            total={order.total_amount}
            disabled={disabled || pending}
            onPick={pick}
            onOther={() => setKeypad(true)}
          />
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
          <p className="counter-ticket-state">
            {clearsAt ? `Clears at ${clearsAt}` : STATUS_LABELS[order.status]}
          </p>
        )}
        {order.status === "cancelled" && order.payment_status === "paid" && <p role="status" className="text-sm font-semibold text-warning-soft-fg">Refund required</p>}
        {!order.pickup_code && <p className="break-all text-xs text-muted">Full order ID: {order.id}</p>}
        <div className="counter-ticket-links">
          {links.map((item) => (
            <button
              key={item.label}
              type="button"
              disabled={disabled || pending || Boolean(held)}
              onClick={item.onClick}
            >
              {item.label}
            </button>
          ))}
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

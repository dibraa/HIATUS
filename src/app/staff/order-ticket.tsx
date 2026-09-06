"use client";

import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { formatPrice, formatElapsed, formatTime, orderCode } from "@/lib/format";
import { getSizeOption } from "@/lib/sizes";
import {
  ADVANCE_LABELS,
  NEXT_STATUS,
  ORDER_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  STATUS_LABELS,
} from "@/lib/order-meta";
import {
  advanceOrderStatus,
  assignTable,
  setOrderPriority,
} from "@/app/actions/staff";
import type { OrderItem, OrderStatus } from "@/types/database";

export type QueueOrder = {
  id: string;
  status: OrderStatus;
  order_type: "dine_in" | "takeout";
  table_label: string | null;
  priority: number;
  payment_method: "cash" | "card" | "ewallet";
  payment_status: "unpaid" | "paid" | "refunded" | "voided";
  total_amount: number;
  discount_amount: number;
  promo_code: string | null;
  pickup_note: string | null;
  created_at: string;
  profiles: { full_name: string | null; phone: string | null } | null;
  order_items: OrderItem[];
};

/**
 * One ticket in the queue.
 *
 * The design question this screen answers is "what does a barista holding a
 * hot drink need", and the answer shapes everything:
 *
 *   - THE ITEMS ARE THE BIGGEST TEXT. Not the customer's name, not the total.
 *     The list of drinks is what the ticket is for, so it gets the weight; the
 *     money is secondary here and belongs to the Payments screen.
 *   - ONE PRIMARY ACTION, always in the same corner. A ticket advances along a
 *     fixed chain (pending → preparing → ready → completed), so the common
 *     case is a single tap on a button whose label says what happens next
 *     ("Start making", "Mark ready"), never a dropdown.
 *   - CORRECTIONS ARE FOLDED AWAY. Re-statusing, seating and bumping are real
 *     needs but rare ones; they live behind a disclosure so they cannot be hit
 *     by accident and do not compete with the primary action.
 *
 * `ready` deliberately does not auto-advance to `completed` — completing means
 * the customer took the drink, which only a person can know.
 */
export function OrderTicket({ order }: { order: QueueOrder }) {
  const [pending, startTransition] = useTransition();
  const [showMore, setShowMore] = useState(false);
  const [tableInput, setTableInput] = useState(order.table_label ?? "");

  const next = NEXT_STATUS[order.status];
  const advanceLabel = ADVANCE_LABELS[order.status];
  const customer = order.profiles?.full_name?.trim() || "Walk-in";
  const isUrgent = order.priority > 0;

  /** One place to run an action, so every one of them reports the same way. */
  function run(fn: () => Promise<{ error: string | null }>, success: string) {
    startTransition(async () => {
      const { error } = await fn();
      if (error) toast.error(error);
      else toast.success(success);
    });
  }

  return (
    <article
      className={`rounded-lg border bg-card p-4 transition-shadow duration-(--hi-dur-base) ease-hi ${
        isUrgent ? "border-accent shadow-md" : "border-line"
      }`}
    >
      {/* ---------- Identity row ---------- */}
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-semibold tracking-wide text-ink">
              {orderCode(order.id)}
            </span>
            {isUrgent && <Badge tone="accent">Priority</Badge>}
          </p>

          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
            {/* The elapsed time is the number that decides which ticket to
                pick up next, so it sits with the code, not in a footer. */}
            <span className="font-medium text-ink-soft">
              {formatElapsed(order.created_at)}
            </span>
            <span aria-hidden="true">&middot;</span>
            <time dateTime={order.created_at}>{formatTime(order.created_at)}</time>
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <OrderStatusBadge status={order.status} />
        </div>
      </div>

      {/* ---------- Fulfilment facts ---------- */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge tone={order.order_type === "dine_in" ? "green" : "neutral"}>
          {ORDER_TYPE_LABELS[order.order_type]}
          {order.table_label && ` · ${order.table_label}`}
        </Badge>

        <Badge tone={order.payment_status === "paid" ? "success" : "warning"}>
          {PAYMENT_STATUS_LABELS[order.payment_status]} ·{" "}
          {PAYMENT_METHOD_LABELS[order.payment_method]}
        </Badge>

        {order.promo_code && <Badge tone="accent">{order.promo_code}</Badge>}
      </div>

      {/* ---------- What to make ---------- */}
      <ul className="mt-4 flex flex-col gap-1.5 border-t border-line pt-3">
        {order.order_items.map((item) => (
          <li key={item.id} className="flex items-baseline gap-2 text-base text-ink">
            <span className="font-semibold numeric text-accent-ink">
              {item.quantity}&times;
            </span>
            <span className="font-medium">{item.item_name}</span>
            {/* Size is optional on the type — rows predating the pricing patch
                have none, and "Medium" would be a guess there. */}
            {item.size && (
              <span className="text-sm text-muted">{getSizeOption(item.size).label}</span>
            )}
          </li>
        ))}
      </ul>

      {order.pickup_note && (
        // A dietary note or a "less ice" is the single most missable thing on
        // a ticket, so it gets a tinted panel rather than a line of body text.
        <p className="mt-3 rounded-md border border-warning-soft-fg/25 bg-warning-soft-bg px-3 py-2 text-sm text-warning-soft-fg">
          <span className="font-semibold">Note:</span> {order.pickup_note}
        </p>
      )}

      {/* ---------- Customer + money + primary action ---------- */}
      <div className="mt-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-3 border-t border-line pt-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink">{customer}</p>
          {order.profiles?.phone && (
            <a
              href={`tel:${order.profiles.phone}`}
              className="text-xs text-accent-ink underline underline-offset-4"
            >
              {order.profiles.phone}
            </a>
          )}
          <p className="mt-1 text-sm font-semibold numeric text-ink-soft">
            {formatPrice(order.total_amount)}
            {order.discount_amount > 0 && (
              <span className="ml-1.5 text-xs font-normal text-muted">
                (−{formatPrice(order.discount_amount)})
              </span>
            )}
          </p>
        </div>

        {next && advanceLabel && (
          <Button
            size="md"
            disabled={pending}
            onClick={() =>
              run(
                () => advanceOrderStatus(order.id, next),
                `${orderCode(order.id)} → ${STATUS_LABELS[next]}`
              )
            }
          >
            {pending ? "Working…" : advanceLabel}
          </Button>
        )}
      </div>

      {/* ---------- Corrections ---------- */}
      <div className="mt-3 border-t border-line pt-3">
        <button
          type="button"
          onClick={() => setShowMore((v) => !v)}
          aria-expanded={showMore}
          className="text-xs font-medium text-muted underline underline-offset-4 transition-colors hover:text-ink"
        >
          {showMore ? "Hide options" : "More options"}
        </button>

        {showMore && (
          <div className="mt-3 flex flex-col gap-3">
            {/* Re-status, for corrections the chain cannot express */}
            <div className="flex flex-wrap items-center gap-2">
              <label
                htmlFor={`status-${order.id}`}
                className="text-xs font-medium text-ink-soft"
              >
                Set status
              </label>
              <select
                id={`status-${order.id}`}
                value={order.status}
                disabled={pending}
                onChange={(e) =>
                  run(
                    () => advanceOrderStatus(order.id, e.target.value as OrderStatus),
                    `${orderCode(order.id)} updated`
                  )
                }
                className="rounded-md border border-line-strong bg-card px-2.5 py-1.5 text-xs text-ink"
              >
                {(Object.keys(STATUS_LABELS) as OrderStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>

            {/* Seating. Submitting on a form so Enter works, which is how this
                actually gets used with a keyboard at the till. */}
            <form
              className="flex flex-wrap items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                run(
                  () => assignTable(order.id, tableInput),
                  tableInput ? `Seated at ${tableInput}` : "Table cleared"
                );
              }}
            >
              <label
                htmlFor={`table-${order.id}`}
                className="text-xs font-medium text-ink-soft"
              >
                Table
              </label>
              <input
                id={`table-${order.id}`}
                value={tableInput}
                onChange={(e) => setTableInput(e.target.value)}
                placeholder="e.g. 4, or by the window"
                className="min-w-0 flex-1 rounded-md border border-line-strong bg-card px-2.5 py-1.5 text-xs text-ink placeholder:text-muted"
              />
              <Button type="submit" size="sm" variant="outline" disabled={pending}>
                Seat
              </Button>
            </form>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-ink-soft">Queue</span>
              <Button
                size="sm"
                variant={isUrgent ? "outline" : "secondary"}
                disabled={pending}
                onClick={() =>
                  run(
                    () => setOrderPriority(order.id, isUrgent ? 0 : 1),
                    isUrgent ? "Priority cleared" : "Bumped to the front"
                  )
                }
              >
                {isUrgent ? "Clear priority" : "Bump to front"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

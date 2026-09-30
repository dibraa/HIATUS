"use client";

import { useTransition } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { formatElapsed, orderCode } from "@/lib/format";
import { getSizeOption } from "@/lib/sizes";
import {
  ADVANCE_LABELS,
  NEXT_STATUS,
  ORDER_TYPE_LABELS,
  STATUS_LABELS,
} from "@/lib/order-meta";
import { advanceOrderStatus } from "@/app/actions/staff";
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
 * The ticket is not a card — it's a bare list item with a hairline separator.
 * The items are the dominant element. Everything else recedes.
 */
export function OrderTicket({ order }: { order: QueueOrder }) {
  const [pending, startTransition] = useTransition();

  const next = NEXT_STATUS[order.status];
  const advanceLabel = ADVANCE_LABELS[order.status];
  const customer = order.profiles?.full_name?.trim() || "Walk-in";
  const isUrgent = order.priority > 0;
  const cannotHandOver = next === "completed" && order.payment_status !== "paid";

  function run(fn: () => Promise<{ error: string | null }>, success: string) {
    startTransition(async () => {
      const { error } = await fn();
      if (error) toast.error(error);
      else toast.success(success);
    });
  }

  return (
    <article
      className={`py-5 ${isUrgent ? "border-l-2 border-accent pl-4" : ""}`}
    >
      {/* ---------- Header: code + time + status ---------- */}
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <span className="display text-lg text-ink">
            {orderCode(order.id)}
          </span>
          {isUrgent && (
            <span className="rounded-sm bg-accent px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-fg">
              Priority
            </span>
          )}
        </div>
        <div className="flex items-baseline gap-3">
          <span className="font-mono text-sm text-muted" suppressHydrationWarning>
            {formatElapsed(order.created_at)}
          </span>
          <OrderStatusBadge status={order.status} />
        </div>
      </div>

      {/* ---------- Items: what to make ---------- */}
      <ul className="mt-3 flex flex-col gap-1">
        {order.order_items.map((item) => (
          <li key={item.id} className="flex items-baseline gap-2 text-xl text-ink">
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

      {/* ---------- Pickup note ---------- */}
      {order.pickup_note && (
        <p className="mt-2 text-sm text-warning-soft-fg">
          <span className="font-semibold">Note:</span> {order.pickup_note}
        </p>
      )}

      {/* ---------- Customer + action ---------- */}
      <div className="mt-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted">{customer}</p>
          <p className="text-xs text-muted">
            {ORDER_TYPE_LABELS[order.order_type]}
            {order.table_label && ` · ${order.table_label}`}
          </p>
        </div>

        {next && advanceLabel && (
          <div className="flex flex-col items-end gap-1">
            <Button
              size="lg"
              disabled={pending || cannotHandOver}
              onClick={() =>
                run(
                  () => advanceOrderStatus(order.id, next),
                  `${orderCode(order.id)} → ${STATUS_LABELS[next]}`
                )
              }
            >
              {pending ? "Working…" : advanceLabel}
            </Button>
            {cannotHandOver && (
              <span className="text-xs text-warning-soft-fg">Pay before handover</span>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

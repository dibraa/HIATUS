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
            <OrderStatusBadge status={order.status} />
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
            <p className="mt-1 text-xs text-warning-soft-fg">
              {order.pickup_note}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
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
          {cannotHandOver && (
            <span className="text-xs font-medium text-warning-soft-fg">Pay first</span>
          )}
        </div>
      </div>

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

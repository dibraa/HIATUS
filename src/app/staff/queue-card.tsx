"use client";

import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { advanceOrderStatus } from "@/app/actions/staff";
import { formatPrice, orderCode } from "@/lib/format";
import { NEXT_STATUS, ORDER_TYPE_LABELS, STATUS_LABELS } from "@/lib/order-meta";
import { getSizeOption } from "@/lib/sizes";
import type { OrderStatus } from "@/types/database";
import type { QueueOrder } from "@/types/staff";

type Props = {
  order: QueueOrder;
  now: number;
  lateAfter: number;
  overAfter: number;
  onOpen: () => void;
  onHandOver: () => void;
};

/**
 * One ticket as a card. The whole card opens the receipt modal; the
 * full-width button at the bottom is the one-tap advance and never opens
 * anything. At most one escalation marker per card, always as text.
 */
export function QueueCard({ order, now, lateAfter, overAfter, onOpen, onHandOver }: Props) {
  const [pending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);

  const code = orderCode(order.id);
  const customer = order.profiles?.full_name?.trim() || "Walk-in";
  const minutes = Math.max(0, Math.floor((now - new Date(order.created_at).getTime()) / 60000));
  const waiting = order.status !== "ready";
  const isNew = order.status === "pending" && minutes < 2;
  const paid = order.payment_status === "paid";
  const typeMeta = `${ORDER_TYPE_LABELS[order.order_type]}${order.table_label ? ` · ${order.table_label}` : ""}`;

  const over = waiting && minutes >= overAfter;
  const late = waiting && !over && minutes >= lateAfter;

  function run(fn: () => Promise<{ error: string | null }>, success: string) {
    startTransition(async () => {
      const { error } = await fn();
      if (error) toast.error(error);
      else toast.success(success);
    });
  }
  const advance = (to: OrderStatus) => run(() => advanceOrderStatus(order.id, to), `${code} to ${STATUS_LABELS[to]}`);

  const next = NEXT_STATUS[order.status];
  const stageChip =
    order.status === "pending" ? (
      <span className="ui-caps rounded-full bg-accent-soft px-2.5 py-1 text-2xs text-accent-ink">New</span>
    ) : order.status === "preparing" ? (
      <span className="ui-caps rounded-full bg-raised px-2.5 py-1 text-2xs text-ink-soft">Making</span>
    ) : (
      <span className="ui-caps rounded-full bg-success-soft-bg px-2.5 py-1 text-2xs text-success-soft-fg">Ready</span>
    );
  const marker = over
    ? { text: `Over ${overAfter}m`, cls: "text-warning" }
    : late
      ? { text: "Late", cls: "text-warning" }
      : order.priority > 0
        ? { text: "Priority", cls: "text-accent-ink" }
        : isNew
          ? { text: "New", cls: "text-accent-ink" }
          : null;

  const visibleItems = expanded ? order.order_items : order.order_items.slice(0, 3);
  const hiddenCount = order.order_items.length - visibleItems.length;
  const clockCls = over || late ? "text-warning" : "text-ink";

  return (
    <article
      aria-label={`Order ${code}. Activate for receipt and actions.`}
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !(e.target as HTMLElement).closest("button")) {
          e.preventDefault();
          onOpen();
        }
      }}
      className={`flex cursor-pointer flex-col rounded-2xl bg-card ring-1 ring-line transition-[transform,box-shadow,border-color] hover:-translate-y-0.5 hover:shadow-md hover:ring-line-strong ${
        isNew ? "shadow-[inset_4px_0_0_var(--hi-accent)]" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2 px-4 pb-1 pt-3.5">
        <div className="min-w-0">
          <p className="display text-2xl leading-none text-ink">{code}</p>
          <p className="mt-1 truncate text-sm font-semibold text-ink-soft">{customer}</p>
        </div>
        <div className="grid shrink-0 justify-items-end gap-1">
          <span className={`numeric text-sm font-semibold ${clockCls}`}>{minutes}m</span>
          {marker && <span className={`ui-caps text-2xs ${marker.cls}`}>{marker.text}</span>}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 px-4 py-2">
        {stageChip}
        <span
          className={`ui-caps rounded-full px-2.5 py-1 text-2xs ${
            paid ? "bg-success-soft-bg text-success-soft-fg" : "bg-raised text-ink-soft"
          }`}
        >
          {paid ? "Paid" : `Unpaid ${formatPrice(order.total_amount)}`}
        </span>
        <span className="ui-caps rounded-full px-2.5 py-1 text-2xs text-muted ring-1 ring-line">{typeMeta}</span>
      </div>

      <ul className="grid gap-1 px-4 pb-2">
        {visibleItems.map((item) => (
          <li key={item.id} className="truncate text-sm text-ink">
            <span className="numeric font-semibold">{item.quantity}x</span> {item.item_name}
            {item.size && <span className="text-xs text-muted"> ({getSizeOption(item.size).label})</span>}
          </li>
        ))}
        {hiddenCount > 0 && (
          <li>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(true);
              }}
              className="min-h-11 text-xs text-muted underline underline-offset-2 hover:text-ink"
            >
              +{hiddenCount} more
            </button>
          </li>
        )}
      </ul>

      {(order.pickup_note || order.special_request_flag) && (
        <p className="mx-4 mb-2 flex gap-1.5 rounded-xl bg-warning-soft-bg px-3 py-2 text-xs text-warning-soft-fg">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="mt-px h-4 w-4 shrink-0 fill-none stroke-current"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M12 9v4M12 17h.01M10.3 3.9 2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
          </svg>
          <span>{order.pickup_note || "Flagged for special handling"}</span>
        </p>
      )}

      <div className="mt-auto p-4 pt-2">
        {next === "completed" ? (
          <Button
            size="md"
            variant="primary"
            loading={pending}
            onClick={(e) => {
              e.stopPropagation();
              if (paid) advance("completed");
              else onHandOver();
            }}
            aria-label={paid ? `Hand over order ${code}` : `Take payment for order ${code}`}
            className="min-h-12 w-full"
          >
            {pending ? "Working" : paid ? "Hand over" : `Take ${formatPrice(order.total_amount)}`}
          </Button>
        ) : next ? (
          <Button
            size="md"
            variant={order.status === "pending" ? "primary" : "outline"}
            loading={pending}
            onClick={(e) => {
              e.stopPropagation();
              advance(next);
            }}
            aria-label={`${order.status === "pending" ? "Start" : "Mark ready"} order ${code}`}
            className="min-h-12 w-full"
          >
            {pending ? "Working" : order.status === "pending" ? "Start" : "Mark ready"}
          </Button>
        ) : null}
      </div>
    </article>
  );
}

"use client";

import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { RowMenu, RowMenuItem, RowMenuLink } from "@/components/ui/row-menu";
import {
  advanceOrderStatus,
  flagSpecialRequest,
  notifyCustomerReady,
  prioritizeOrder,
  refundOrder,
  voidOrder,
} from "@/app/actions/staff";
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
  selected: boolean;
  onHandOver: () => void;
  onShowDetails?: () => void;
};
export function QueueRow({ order, now, lateAfter, overAfter, selected, onHandOver }: Props) {
  const [pending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState<"refund" | "void" | null>(null);
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
  const actionLabel =
    order.status === "pending"
      ? "Start"
      : order.status === "preparing"
        ? "Mark ready"
        : paid
          ? "Hand over"
          : `Take ${formatPrice(order.total_amount)}`;

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

  const clockCls = over || late ? "text-warning" : minutes >= lateAfter ? "text-ink-soft font-medium" : "text-muted";
  const edgeCls = over
    ? "border-l-2 border-l-line-strong"
    : late
      ? "border-l border-l-line-strong"
      : isNew
        ? "shadow-[inset_4px_0_0_var(--hi-accent)]"
        : "border-l border-l-line";

  return (
    <li
      className={`flex min-h-[4.25rem] items-start gap-3 bg-card px-4 py-3 ${edgeCls} ${selected ? "bg-raised" : ""}`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="display text-base text-ink">{code}</span>
          <span className="truncate text-sm font-semibold text-ink-soft">{customer}</span>
          <span className="ui-caps hidden shrink-0 text-2xs text-muted sm:inline">{typeMeta}</span>
        </div>
        <div className="mt-1 grid gap-0.5">
          {visibleItems.map((item) => (
            <span key={item.id} className="truncate text-sm text-ink">
              <span className="numeric font-semibold">{item.quantity}x</span> {item.item_name}
              {item.size && <span className="text-xs text-muted"> ({getSizeOption(item.size).label})</span>}
            </span>
          ))}
          {hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="w-fit text-xs text-muted underline underline-offset-2 hover:text-ink"
            >
              +{hiddenCount} more
            </button>
          )}
        </div>
        {(order.pickup_note || order.special_request_flag) && (
          <p className="mt-1.5 flex gap-1.5 text-xs text-warning">
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
        <span className="ui-caps mt-1 block text-2xs text-muted sm:hidden">{typeMeta}</span>
      </div>

      <div className="flex w-14 shrink-0 flex-col items-end gap-1 pt-0.5">
        <span className={`numeric text-sm ${clockCls}`}>{minutes}m</span>
        {marker && <span className={`ui-caps text-2xs ${marker.cls}`}>{marker.text}</span>}
        {!paid && order.payment_status === "unpaid" && (
          <span className="ui-caps text-2xs text-muted">unpaid</span>
        )}
      </div>

      <div className="flex w-36 shrink-0 items-start gap-1.5">
        {next === "completed" ? (
          <Button
            size="sm"
            variant="primary"
            loading={pending}
            onClick={paid ? () => advance("completed") : onHandOver}
            aria-label={paid ? `Hand over order ${code}` : `Take payment for order ${code}`}
            className="min-h-11 flex-1"
          >
            {pending ? "Working" : actionLabel}
          </Button>
        ) : next ? (
          <Button
            size="sm"
            variant="outline"
            loading={pending}
            onClick={() => advance(next)}
            aria-label={`${actionLabel} order ${code}`}
            className="min-h-11 flex-1"
          >
            {pending ? "Working" : actionLabel}
          </Button>
        ) : null}
        <RowMenu label={`More actions for ${code}`}>
          {order.status === "pending" && (
            <RowMenuItem
              onClick={() =>
                run(
                  () => prioritizeOrder(order.id, !(order.priority > 0)),
                  order.priority > 0 ? `${code} priority removed` : `${code} moved to front`
                )
              }
            >
              {order.priority > 0 ? "Remove priority" : "Prioritize"}
            </RowMenuItem>
          )}
          <RowMenuItem
            onClick={() =>
              run(
                () => flagSpecialRequest(order.id, !order.special_request_flag),
                order.special_request_flag ? `${code} flag removed` : `${code} flagged`
              )
            }
          >
            {order.special_request_flag ? "Unflag request" : "Flag request"}
          </RowMenuItem>
          {order.status === "ready" && (
            <RowMenuItem onClick={() => run(() => notifyCustomerReady(order.id), `${code} customer notified`)}>
              Notify customer again
            </RowMenuItem>
          )}
          {hiddenCount > 0 && !expanded && <RowMenuItem onClick={() => setExpanded(true)}>Show full order</RowMenuItem>}
          {expanded && hiddenCount === 0 && order.order_items.length > 3 && (
            <RowMenuItem onClick={() => setExpanded(false)}>Collapse order</RowMenuItem>
          )}
          <RowMenuLink href={`/staff/pos/receipt/${order.id}`}>Print receipt</RowMenuLink>
          <RowMenuLink href="/staff/menu">Mark sold out</RowMenuLink>
          <RowMenuItem onClick={() => run(() => advanceOrderStatus(order.id, order.status), `${code} status: ${STATUS_LABELS[order.status]}`)}>
            Show order details ({STATUS_LABELS[order.status]})
          </RowMenuItem>
          {paid && (
            <RowMenuItem danger onClick={() => setConfirm("refund")}>
              Refund {formatPrice(order.total_amount)}
            </RowMenuItem>
          )}
          {(paid || order.payment_status === "unpaid") && (
            <RowMenuItem danger onClick={() => setConfirm("void")}>
              Void transaction
            </RowMenuItem>
          )}
        </RowMenu>
      </div>

      <Modal
        open={confirm === "refund"}
        title="Refund transaction"
        body={`Refund ${code} for ${formatPrice(order.total_amount)}? This marks the payment as refunded.`}
        confirmLabel="Refund transaction"
        danger
        onConfirm={() => {
          setConfirm(null);
          run(() => refundOrder(order.id, null, "refund issued by staff"), `${code} refund recorded`);
        }}
        onCancel={() => setConfirm(null)}
      />
      <Modal
        open={confirm === "void"}
        title="Void transaction"
        body={`Void ${code}? This cancels the order and reverses its transaction.`}
        confirmLabel="Void transaction"
        danger
        onConfirm={() => {
          setConfirm(null);
          run(() => voidOrder(order.id, "voided by staff"), `${code} transaction voided`);
        }}
        onCancel={() => setConfirm(null)}
      />
      <span className="sr-only" aria-live="polite">
        {pending ? `Working on ${code}` : ""}
      </span>
    </li>
  );
}

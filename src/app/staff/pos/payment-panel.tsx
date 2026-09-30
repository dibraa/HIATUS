"use client";

import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { formatPrice, formatTime, orderCode } from "@/lib/format";
import { getSizeOption } from "@/lib/sizes";
import {
  ORDER_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/order-meta";
import {
  applyManualDiscount,
  refundOrder,
  takePayment,
  voidOrder,
} from "@/app/actions/staff";
import type {
  OrderItem,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "@/types/database";

export type PosOrder = {
  id: string;
  status: OrderStatus;
  order_type: "dine_in" | "takeout";
  table_label: string | null;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  subtotal_amount: number;
  discount_amount: number;
  total_amount: number;
  created_at: string;
  paid_at: string | null;
  profiles: { full_name: string | null } | null;
  order_items: OrderItem[];
};

const METHODS: PaymentMethod[] = ["cash", "card", "ewallet"];

/**
 * One order at the till — distilled to the single question: has the money arrived?
 *
 *   - WHAT'S OWED (items + total)
 *   - HOW TO TAKE IT (payment method + one button)
 *
 * The panel is a card with a hairline border. The total is the dominant
 * element. Everything else recedes.
 */
export function PaymentPanel({ order }: { order: PosOrder }) {
  const [pending, startTransition] = useTransition();
  const [method, setMethod] = useState<PaymentMethod>(order.payment_method);
  const [tendered, setTendered] = useState("");
  const [showAdjust, setShowAdjust] = useState(false);
  const [discount, setDiscount] = useState("");
  const [discountReason, setDiscountReason] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [confirmPayment, setConfirmPayment] = useState(false);
  const [confirmRefund, setConfirmRefund] = useState(false);
  const [confirmVoid, setConfirmVoid] = useState(false);

  const isUnpaid = order.payment_status === "unpaid";
  const customer = order.profiles?.full_name?.trim() || "Walk-in";

  const tenderedNumber = Number(tendered);
  const change =
    method === "cash" && tendered !== "" && Number.isFinite(tenderedNumber)
      ? tenderedNumber - order.total_amount
      : null;

  function run(fn: () => Promise<{ error: string | null }>, success: string) {
    startTransition(async () => {
      const { error } = await fn();
      if (error) {
        toast.error(error);
        return;
      }
      toast.success(success);
      setTendered("");
      setDiscount("");
      setDiscountReason("");
      setRefundReason("");
    });
  }

  return (
    <article className="py-4">
      {/* ---------- Top row: code + customer + status ---------- */}
      <div className="flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <span className="display text-base text-ink">
            {orderCode(order.id)}
          </span>
          <span className="ml-2 text-xs text-muted">
            {customer}
            {order.table_label && ` · ${order.table_label}`}
          </span>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {/* ---------- The bill ---------- */}
      <ul className="mt-3 flex flex-col gap-0.5">
        {order.order_items.map((item) => (
          <li key={item.id} className="flex justify-between gap-4 text-sm">
            <span className="min-w-0 text-ink-soft">
              <span className="text-muted">{item.quantity}&times;</span>{" "}
              {item.item_name}
              {item.size && (
                <span className="text-xs text-muted"> · {getSizeOption(item.size).label}</span>
              )}
            </span>
            <span className="shrink-0 text-ink">
              {formatPrice(item.subtotal)}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-2 flex justify-between border-t border-line pt-2">
        <span className="text-xs text-muted">Total</span>
        <span className="display text-lg text-ink">
          {formatPrice(order.total_amount)}
        </span>
      </div>

      {/* ---------- Take the money ---------- */}
      {isUnpaid ? (
        <div className="mt-4">
          <div className="grid grid-cols-3 gap-1.5">
            {METHODS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                aria-pressed={method === m}
                className={`rounded-md border px-2 py-3 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
                  method === m
                    ? "border-cta bg-cta text-cta-fg"
                    : "border-line bg-transparent text-ink-soft hover:border-ink-soft hover:text-ink"
                }`}
              >
                {PAYMENT_METHOD_LABELS[m]}
              </button>
            ))}
          </div>

          {method === "cash" && (
            <div className="mt-3 flex items-end gap-3">
              <div className="flex-1">
                <label
                  htmlFor={`tendered-${order.id}`}
                  className="mb-1 block text-[10px] text-muted"
                >
                  Cash received
                </label>
                <input
                  id={`tendered-${order.id}`}
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={tendered}
                  onChange={(e) => setTendered(e.target.value)}
                  placeholder={String(order.total_amount)}
                  className="w-full rounded-md border border-line bg-transparent px-2.5 py-2 text-sm text-ink placeholder:text-muted"
                />
              </div>
              <p aria-live="polite" className="min-w-[5rem] pb-1.5 text-xs font-medium">
                {change === null ? (
                  <span className="text-muted">Change</span>
                ) : change < 0 ? (
                  <span className="text-danger">Short {formatPrice(Math.abs(change))}</span>
                ) : (
                  <span className="text-success">Change {formatPrice(change)}</span>
                )}
              </p>
            </div>
          )}

          <Button
            size="md"
            className="mt-3 w-full"
            disabled={pending}
            onClick={() => setConfirmPayment(true)}
          >
            {pending
              ? "Recording…"
              : `Take ${formatPrice(order.total_amount)}`}
          </Button>

          <Modal
            open={confirmPayment}
            title="Take payment"
            body={`Record ${formatPrice(order.total_amount)} from ${orderCode(order.id)} via ${PAYMENT_METHOD_LABELS[method]}?`}
            confirmLabel="Take payment"
            cancelLabel="Cancel"
            onConfirm={() => {
              setConfirmPayment(false);
              run(
                () => takePayment(order.id, method, null, ""),
                `${orderCode(order.id)} paid · ${PAYMENT_METHOD_LABELS[method]}`
              );
            }}
            onCancel={() => setConfirmPayment(false)}
          />
        </div>
      ) : (
        <p className="mt-3 text-xs text-muted">
          {PAYMENT_STATUS_LABELS[order.payment_status]} by{" "}
          {PAYMENT_METHOD_LABELS[order.payment_method].toLowerCase()}
          {order.paid_at && (
            <>
              {" "}
              at <time dateTime={order.paid_at}>{formatTime(order.paid_at)}</time>
            </>
          )}
        </p>
      )}

      {/* ---------- Adjustments (folded away) ---------- */}
      <div className="mt-3">
        <button
          type="button"
          onClick={() => setShowAdjust((v) => !v)}
          aria-expanded={showAdjust}
          className="text-[10px] text-muted underline underline-offset-2 transition-colors hover:text-ink"
        >
          {showAdjust ? "Hide" : "Discount, refund or void"}
        </button>

        {showAdjust && (
          <div className="mt-2 flex flex-col gap-2">
            {isUnpaid && (
              <form
                className="flex flex-col gap-1.5 rounded-md border border-line p-2.5"
                onSubmit={(e) => {
                  e.preventDefault();
                  run(
                    () => applyManualDiscount(order.id, Number(discount), discountReason),
                    "Discount applied"
                  );
                }}
              >
                <p className="text-[10px] font-medium text-ink-soft">Discount</p>
                <div className="flex flex-wrap gap-1.5">
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    placeholder="Amount"
                    aria-label="Discount amount"
                    className="w-20 rounded-md border border-line px-2 py-1 text-xs text-ink placeholder:text-muted"
                  />
                  <input
                    required
                    value={discountReason}
                    onChange={(e) => setDiscountReason(e.target.value)}
                    placeholder="Reason"
                    aria-label="Reason for the discount"
                    className="min-w-0 flex-1 rounded-md border border-line px-2 py-1 text-xs text-ink placeholder:text-muted"
                  />
                  <Button type="submit" size="sm" variant="outline" disabled={pending}>
                    Apply
                  </Button>
                </div>
              </form>
            )}

            <form
              className="flex flex-col gap-1.5 rounded-md border border-line p-2.5"
              onSubmit={(e) => {
                e.preventDefault();
                setConfirmRefund(true);
              }}
            >
              <p className="text-[10px] font-medium text-ink-soft">Refund</p>
              <div className="flex flex-wrap gap-1.5">
                <input
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Reason"
                  aria-label="Reason for the refund"
                  className="min-w-0 flex-1 rounded-md border border-line px-2 py-1 text-xs text-ink placeholder:text-muted"
                />
                <Button
                  type="submit"
                  size="sm"
                  variant="danger"
                  disabled={pending || isUnpaid}
                >
                  Refund
                </Button>
              </div>
            </form>

            <div className="rounded-md border border-danger/30 p-2.5">
              <p className="text-[10px] font-medium text-danger-soft-fg">Void</p>
              <Button
                size="sm"
                variant="danger"
                className="mt-1"
                disabled={pending}
                onClick={() => setConfirmVoid(true)}
              >
                Void order
              </Button>
            </div>
          </div>
        )}
      </div>

      <Modal
        open={confirmRefund}
        title="Refund order"
        body={`Refund ${orderCode(order.id)}? This returns ${formatPrice(order.total_amount)}.`}
        confirmLabel="Refund"
        cancelLabel="Cancel"
        danger
        onConfirm={() => {
          setConfirmRefund(false);
          run(
            () => refundOrder(order.id, null, refundReason),
            "Refund recorded"
          );
        }}
        onCancel={() => setConfirmRefund(false)}
      />

      <Modal
        open={confirmVoid}
        title="Void order"
        body={`Void ${orderCode(order.id)}? This reverses ${formatPrice(order.total_amount)}.`}
        confirmLabel="Void order"
        cancelLabel="Cancel"
        danger
        onConfirm={() => {
          setConfirmVoid(false);
          run(() => voidOrder(order.id, "voided at the till"), "Order voided");
        }}
        onCancel={() => setConfirmVoid(false)}
      />
    </article>
  );
}

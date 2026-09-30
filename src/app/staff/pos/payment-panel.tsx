"use client";

import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
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
 * The panel is not a card — it's a bare section with a hairline separator.
 * The total is the dominant element. Everything else recedes.
 */
export function PaymentPanel({ order }: { order: PosOrder }) {
  const [pending, startTransition] = useTransition();
  const [method, setMethod] = useState<PaymentMethod>(order.payment_method);
  const [tendered, setTendered] = useState("");
  const [showAdjust, setShowAdjust] = useState(false);
  const [discount, setDiscount] = useState("");
  const [discountReason, setDiscountReason] = useState("");
  const [refundReason, setRefundReason] = useState("");

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
    <article className="py-5">
      {/* ---------- Header: code + customer + status ---------- */}
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <span className="display text-lg text-ink">
            {orderCode(order.id)}
          </span>
          <p className="mt-0.5 text-sm text-muted">
            {customer} · {ORDER_TYPE_LABELS[order.order_type]}
            {order.table_label && ` · ${order.table_label}`}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {/* ---------- The bill ---------- */}
      <ul className="mt-4 flex flex-col gap-1">
        {order.order_items.map((item) => (
          <li key={item.id} className="flex justify-between gap-4 text-base">
            <span className="min-w-0 text-ink-soft">
              <span className="text-muted">{item.quantity}&times;</span>{" "}
              {item.item_name}
              {item.size && (
                <span className="text-sm text-muted"> · {getSizeOption(item.size).label}</span>
              )}
            </span>
            <span className="shrink-0 font-medium text-ink">
              {formatPrice(item.subtotal)}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex justify-between border-t border-line pt-3">
        <span className="text-muted">Total</span>
        <span className="display text-2xl text-ink">
          {formatPrice(order.total_amount)}
        </span>
      </div>

      {/* ---------- Take the money ---------- */}
      {isUnpaid ? (
        <div className="mt-5">
          {/* Payment method: 3 large buttons */}
          <div className="grid grid-cols-3 gap-2">
            {METHODS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                className={`rounded-md border-2 px-3 py-3 text-sm font-medium transition-colors ${
                  method === m
                    ? "border-accent bg-accent text-accent-fg"
                    : "border-line bg-card text-ink-soft hover:border-ink-soft hover:text-ink"
                }`}
              >
                {PAYMENT_METHOD_LABELS[m]}
              </button>
            ))}
          </div>

          {method === "cash" && (
            <div className="mt-4 flex items-end gap-3">
              <div className="flex-1">
                <label
                  htmlFor={`tendered-${order.id}`}
                  className="mb-1 block text-xs text-muted"
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
                  className="w-full rounded-md border border-line bg-card px-3 py-2.5 text-base font-medium text-ink placeholder:text-muted"
                />
              </div>
              <p aria-live="polite" className="min-w-[6rem] pb-2 text-sm font-medium">
                {change === null ? (
                  <span className="text-muted">Change —</span>
                ) : change < 0 ? (
                  <span className="text-danger">Short {formatPrice(Math.abs(change))}</span>
                ) : (
                  <span className="text-success">Change {formatPrice(change)}</span>
                )}
              </p>
            </div>
          )}

          <Button
            size="lg"
            className="mt-4 w-full"
            disabled={pending}
            onClick={() =>
              run(
                () => takePayment(order.id, method, null, ""),
                `${orderCode(order.id)} paid · ${PAYMENT_METHOD_LABELS[method]}`
              )
            }
          >
            {pending
              ? "Recording…"
              : `Take ${formatPrice(order.total_amount)}`}
          </Button>
        </div>
      ) : (
        <p className="mt-5 text-sm text-muted">
          {PAYMENT_STATUS_LABELS[order.payment_status]} by{" "}
          {PAYMENT_METHOD_LABELS[order.payment_method].toLowerCase()}
          {order.paid_at && (
            <>
              {" "}
              at <time dateTime={order.paid_at}>{formatTime(order.paid_at)}</time>
            </>
          )}
          .
        </p>
      )}

      {/* ---------- Adjustments (folded away) ---------- */}
      <div className="mt-4">
        <button
          type="button"
          onClick={() => setShowAdjust((v) => !v)}
          aria-expanded={showAdjust}
          className="text-xs text-muted underline underline-offset-4 transition-colors hover:text-ink"
        >
          {showAdjust ? "Hide adjustments" : "Discount, refund or void"}
        </button>

        {showAdjust && (
          <div className="mt-3 flex flex-col gap-3">
            {isUnpaid && (
              <form
                className="flex flex-col gap-2 rounded-md border border-line bg-raised p-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  run(
                    () => applyManualDiscount(order.id, Number(discount), discountReason),
                    "Discount applied"
                  );
                }}
              >
                <p className="text-xs font-semibold text-ink-soft">Manual discount</p>
                <div className="flex flex-wrap gap-2">
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    placeholder="Amount"
                    aria-label="Discount amount"
                    className="w-28 rounded-md border border-line bg-card px-2.5 py-1.5 text-sm text-ink placeholder:text-muted"
                  />
                  <input
                    required
                    value={discountReason}
                    onChange={(e) => setDiscountReason(e.target.value)}
                    placeholder="Reason (required)"
                    aria-label="Reason for the discount"
                    className="min-w-0 flex-1 rounded-md border border-line bg-card px-2.5 py-1.5 text-sm text-ink placeholder:text-muted"
                  />
                  <Button type="submit" size="sm" variant="outline" disabled={pending}>
                    Apply
                  </Button>
                </div>
              </form>
            )}

            <form
              className="flex flex-col gap-2 rounded-md border border-line bg-raised p-3"
              onSubmit={(e) => {
                e.preventDefault();
                run(
                  () => refundOrder(order.id, null, refundReason),
                  "Refund recorded"
                );
              }}
            >
              <p className="text-xs font-semibold text-ink-soft">Refund in full</p>
              <div className="flex flex-wrap gap-2">
                <input
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Reason"
                  aria-label="Reason for the refund"
                  className="min-w-0 flex-1 rounded-md border border-line bg-card px-2.5 py-1.5 text-sm text-ink placeholder:text-muted"
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
              {isUnpaid && (
                <p className="text-xs text-muted">
                  Nothing has been taken for this order yet.
                </p>
              )}
            </form>

            <div className="rounded-md border border-line bg-raised p-3">
              <p className="text-xs font-semibold text-ink-soft">Void</p>
              <p className="mt-1 text-xs text-muted">
                Cancels the order and reverses anything taken.
              </p>
              <Button
                size="sm"
                variant="danger"
                className="mt-2"
                disabled={pending}
                onClick={() =>
                  run(() => voidOrder(order.id, "voided at the till"), "Order voided")
                }
              >
                Void order
              </Button>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

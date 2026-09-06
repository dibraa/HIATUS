"use client";

import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  promo_code: string | null;
  created_at: string;
  paid_at: string | null;
  profiles: { full_name: string | null } | null;
  order_items: OrderItem[];
};

const METHODS: PaymentMethod[] = ["cash", "card", "ewallet"];

/**
 * One order at the till.
 *
 * The whole panel is organised around a single question — has the money
 * arrived — because that is the only thing this screen is for. An unpaid order
 * shows the tender buttons and nothing else; a paid one shows what was taken
 * and folds the awkward operations (refund, void) behind a disclosure.
 *
 * WHAT IS AND IS NOT SENT TO THE SERVER
 *
 * Cash tendered is computed here purely to show change due. It is NOT what
 * gets recorded: `takePayment` sends `null` for the amount, and the RPC fills
 * in the order total from the database. A till that recorded whatever number
 * the client typed would be a till that could be talked into recording ₱1 for
 * a ₱200 order, and server-derived pricing everywhere else would have been
 * for nothing.
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

  // Only meaningful for cash, and only once enough has been handed over.
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
    <article className="rounded-lg border border-line bg-card p-4">
      {/* ---------- Identity ---------- */}
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <p className="font-mono text-sm font-semibold tracking-wide text-ink">
            {orderCode(order.id)}
          </p>
          <p className="mt-1 text-xs text-muted">
            {customer} &middot;{" "}
            <time dateTime={order.created_at}>{formatTime(order.created_at)}</time>
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <OrderStatusBadge status={order.status} />
          <Badge tone={isUnpaid ? "warning" : "success"}>
            {PAYMENT_STATUS_LABELS[order.payment_status]}
          </Badge>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge tone={order.order_type === "dine_in" ? "green" : "neutral"}>
          {ORDER_TYPE_LABELS[order.order_type]}
          {order.table_label && ` · ${order.table_label}`}
        </Badge>
        {order.promo_code && <Badge tone="accent">{order.promo_code}</Badge>}
      </div>

      {/* ---------- The bill ---------- */}
      <ul className="mt-4 flex flex-col gap-1 border-t border-line pt-3 text-sm">
        {order.order_items.map((item) => (
          <li key={item.id} className="flex justify-between gap-4">
            <span className="min-w-0 text-ink-soft">
              <span className="numeric text-muted">{item.quantity}&times;</span>{" "}
              {item.item_name}
              {item.size && (
                <span className="text-muted"> &middot; {getSizeOption(item.size).label}</span>
              )}
            </span>
            <span className="shrink-0 numeric text-ink">
              {formatPrice(item.subtotal)}
            </span>
          </li>
        ))}
      </ul>

      <dl className="mt-3 flex flex-col gap-1 border-t border-line pt-3 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Subtotal</dt>
          <dd className="numeric text-ink-soft">
            {formatPrice(order.subtotal_amount)}
          </dd>
        </div>

        {order.discount_amount > 0 && (
          <div className="flex justify-between gap-4">
            <dt className="text-muted">
              Discount{order.promo_code ? ` (${order.promo_code})` : ""}
            </dt>
            <dd className="numeric text-success">
              −{formatPrice(order.discount_amount)}
            </dd>
          </div>
        )}

        <div className="mt-1 flex justify-between gap-4 border-t border-line pt-2">
          <dt className="display text-lg text-ink">Total</dt>
          <dd className="text-base font-semibold numeric text-ink">
            {formatPrice(order.total_amount)}
          </dd>
        </div>
      </dl>

      {/* ---------- Take the money ---------- */}
      {isUnpaid ? (
        <div className="mt-4 border-t border-line pt-4">
          <fieldset>
            <legend className="eyebrow text-muted">
              Tender
            </legend>

            {/* Radios, not buttons: this is a single choice from a fixed set,
                and radios give arrow-key navigation and a group name for free. */}
            <div className="mt-2.5 flex flex-wrap gap-2">
              {METHODS.map((m) => (
                <label
                  key={m}
                  className={`ui-caps inline-flex cursor-pointer items-center gap-2 rounded-md border px-3.5 py-2 text-2xs transition-colors ${
                    method === m
                      ? "border-accent bg-accent text-accent-fg"
                      : "border-line-strong bg-card text-ink-soft hover:border-ink-soft hover:text-ink"
                  }`}
                >
                  <input
                    type="radio"
                    name={`method-${order.id}`}
                    value={m}
                    checked={method === m}
                    onChange={() => setMethod(m)}
                    className="sr-only"
                  />
                  {PAYMENT_METHOD_LABELS[m]}
                </label>
              ))}
            </div>
          </fieldset>

          {method === "cash" && (
            <div className="mt-3 flex flex-wrap items-end gap-3">
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <label
                  htmlFor={`tendered-${order.id}`}
                  className="text-xs font-medium text-ink-soft"
                >
                  Cash received{" "}
                  <span className="font-normal text-muted">(for change only)</span>
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
                  className="w-full rounded-md border border-line-strong bg-card px-3 py-2 text-sm numeric text-ink placeholder:text-muted"
                />
              </div>

              {/* aria-live: the change is the number the barista reads aloud,
                  and it appears away from the field being typed into. */}
              <p
                aria-live="polite"
                className="min-w-[8rem] pb-2 text-sm numeric"
              >
                {change === null ? (
                  <span className="text-muted">Change —</span>
                ) : change < 0 ? (
                  <span className="font-medium text-danger">
                    Short {formatPrice(Math.abs(change))}
                  </span>
                ) : (
                  <span className="font-semibold text-success">
                    Change {formatPrice(change)}
                  </span>
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
              : `Take ${formatPrice(order.total_amount)} · ${PAYMENT_METHOD_LABELS[method]}`}
          </Button>
        </div>
      ) : (
        <p className="mt-4 border-t border-line pt-4 text-sm text-muted">
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

      {/* ---------- Adjustments ---------- */}
      <div className="mt-3 border-t border-line pt-3">
        <button
          type="button"
          onClick={() => setShowAdjust((v) => !v)}
          aria-expanded={showAdjust}
          className="text-xs font-medium text-muted underline underline-offset-4 transition-colors hover:text-ink"
        >
          {showAdjust ? "Hide adjustments" : "Discount, refund or void"}
        </button>

        {showAdjust && (
          <div className="mt-3 flex flex-col gap-4">
            {isUnpaid && (
              // Only offered before payment. Discounting a settled bill is a
              // refund, and the RPC refuses it — so the UI does not offer it.
              <form
                className="flex flex-col gap-2 rounded-md border border-line bg-raised p-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  run(
                    () =>
                      applyManualDiscount(order.id, Number(discount), discountReason),
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
                    className="w-28 rounded-md border border-line-strong bg-card px-2.5 py-1.5 text-xs numeric text-ink placeholder:text-muted"
                  />
                  {/* Required, and the RPC rejects a blank one too: "who
                      discounted this and why" is the first question asked when
                      a drawer comes up short. */}
                  <input
                    required
                    value={discountReason}
                    onChange={(e) => setDiscountReason(e.target.value)}
                    placeholder="Reason (required)"
                    aria-label="Reason for the discount"
                    className="min-w-0 flex-1 rounded-md border border-line-strong bg-card px-2.5 py-1.5 text-xs text-ink placeholder:text-muted"
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
                  className="min-w-0 flex-1 rounded-md border border-line-strong bg-card px-2.5 py-1.5 text-xs text-ink placeholder:text-muted"
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
                <p className="text-2xs text-muted">
                  Nothing has been taken for this order yet.
                </p>
              )}
            </form>

            <div className="rounded-md border border-line bg-raised p-3">
              <p className="text-xs font-semibold text-ink-soft">Void</p>
              <p className="mt-1 text-2xs text-muted">
                Cancels the order and reverses anything taken. For a ticket rung
                up by mistake — not for a customer changing their mind.
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

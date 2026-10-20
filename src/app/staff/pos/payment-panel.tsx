"use client";

import { useEffect, useState, useTransition } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { formatPrice, formatTime, orderCode } from "@/lib/format";
import { getSizeOption } from "@/lib/sizes";
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/order-meta";
import {
  advanceOrderStatus,
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

/** The step a payment carries the order on to, when there is one. */
export type PaymentThen = "preparing" | "completed";

const METHODS: PaymentMethod[] = ["cash", "ewallet"];

/** What the order becomes after payment, as the button and toast say it. */
const THEN_COPY: Record<PaymentThen, { action: string; done: string; failed: string }> = {
  preparing: { action: "start making", done: "started", failed: "moved to Making" },
  completed: { action: "hand over", done: "handed over", failed: "marked handed over" },
};

/**
 * One order at the till: what is owed, and the one button that records it.
 *
 * Customers pay at the counter before their drink is made, so the payment
 * usually carries the order straight on (`then`): "Paid ₱120 · start making"
 * records the payment and moves the order in one press. The button names the
 * amount and the method, so it is the confirmation; there is no second dialog.
 * Short cash disables it, and a wrong entry is corrected with refund or void,
 * which still ask for a reason and confirm.
 *
 * It calls the same two actions as before, in the same order (takePayment,
 * then advanceOrderStatus), so the pay-before-hand-over rule stays with the
 * API. If the payment saves but the move fails, the panel says so and offers
 * the move again; it never asks for the money twice.
 */
export function PaymentPanel({
  order,
  then,
  onBusyChange,
  onDone,
}: {
  order: PosOrder;
  then?: PaymentThen;
  onBusyChange?: (busy: boolean) => void;
  /** Called once the payment (and the move, if any) has gone through. */
  onDone?: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [method, setMethod] = useState<PaymentMethod>(order.payment_method);
  const [tendered, setTendered] = useState("");
  const [showAdjust, setShowAdjust] = useState(false);
  const [discount, setDiscount] = useState("");
  const [discountReason, setDiscountReason] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [voidReason, setVoidReason] = useState("");
  const [confirmRefund, setConfirmRefund] = useState(false);
  const [confirmVoid, setConfirmVoid] = useState(false);
  /** Set when the payment saved but the follow-on move did not. */
  const [stuck, setStuck] = useState<string | null>(null);

  useEffect(() => {
    onBusyChange?.(pending || confirmRefund || confirmVoid);
  }, [pending, confirmRefund, confirmVoid, onBusyChange]);

  const code = orderCode(order.id);
  const total = formatPrice(order.total_amount);
  const isUnpaid = order.payment_status === "unpaid";
  const canPay = isUnpaid && order.status !== "cancelled" && !stuck;

  const tenderedNumber = Number(tendered);
  const change =
    method === "cash" && tendered !== "" && Number.isFinite(tenderedNumber)
      ? tenderedNumber - order.total_amount
      : null;
  const cashValid =
    method !== "cash" ||
    (tendered.trim() !== "" &&
      Number.isFinite(tenderedNumber) &&
      tenderedNumber >= order.total_amount);
  const quickCash = [
    order.total_amount,
    ...[100, 200, 500, 1000].filter((amount) => amount > order.total_amount),
  ].slice(0, 4);
  const locked = pending || confirmRefund || confirmVoid;

  const paidWord =
    method === "cash" ? `Paid ${total}` : "Transfer received";
  const primaryLabel = then ? `${paidWord} · ${THEN_COPY[then].action}` : paidWord;

  // Failures are a pop-up only; the one exception is `stuck` below, which
  // stays on screen because it carries the "Try again" that finishes the job.
  function fail(message: string) {
    toast.error(message);
  }

  /** Move the order on after a recorded payment. */
  async function move(to: PaymentThen) {
    const moved = await advanceOrderStatus(order.id, to);
    if (moved.error) {
      const message = `Payment of ${total} is recorded. ${code} couldn't be ${THEN_COPY[to].failed}: ${moved.error}`;
      setStuck(message);
      toast.error(message);
      return false;
    }
    return true;
  }

  function pay(carryOn: boolean) {
    startTransition(async () => {
      try {
        const paid = await takePayment(order.id, method, null, "");
        if (paid.error) return fail(paid.error);
        const how = PAYMENT_METHOD_LABELS[method].toLowerCase();
        if (carryOn && then) {
          if (!(await move(then))) return;
          toast.success(`${code} · paid ${total} ${how} · ${THEN_COPY[then].done}`);
        } else {
          toast.success(`${code} · paid ${total} ${how}`);
        }
        onDone?.();
      } catch {
        fail("Couldn't record the payment. Refresh the order before trying again.");
      }
    });
  }

  function retryMove() {
    if (!then) return;
    startTransition(async () => {
      try {
        if (!(await move(then))) return;
        setStuck(null);
        toast.success(`${code} · ${THEN_COPY[then].done}`);
        onDone?.();
      } catch {
        fail("Couldn't reach the server. Try again in a moment.");
      }
    });
  }

  function run(fn: () => Promise<{ error: string | null }>, success: string) {
    startTransition(async () => {
      try {
        const { error } = await fn();
        if (error) return fail(error);
        toast.success(success);
        setDiscount("");
        setDiscountReason("");
        setRefundReason("");
      } catch {
        fail("Couldn't record the change. Refresh the order before trying again.");
      }
    });
  }

  // Inputs on this panel share one edge and size: a visible 3.39:1 border
  // (line-strong) and the 44px control height.
  const field =
    "min-h-11 rounded-md border border-line-strong bg-card px-3 text-sm text-ink placeholder:text-muted transition-colors hover:border-ink-soft";

  return (
    <article className="py-4">
      <fieldset disabled={locked} className="min-w-0">
        <legend className="sr-only">Payment for {code}</legend>

        {/* ---------- What they ordered ----------
            Who and which order live in the dialog's title row, so the panel
            starts at the bill instead of repeating the code. */}
        <ul className="flex flex-col gap-1">
          {order.order_items.map((item) => (
            <li key={item.id} className="flex justify-between gap-4 text-sm">
              <span className="min-w-0 text-ink-soft">
                <span className="numeric text-muted">{item.quantity}&times;</span>{" "}
                {item.item_name}
                {item.size && (
                  <span className="text-xs text-muted">
                    {" "}
                    · {getSizeOption(item.size).label}
                  </span>
                )}
              </span>
              <span className="numeric shrink-0 text-ink">
                {formatPrice(item.subtotal)}
              </span>
            </li>
          ))}
        </ul>

        {/* The amount owed is the one number the barista reads aloud, so it
            is the largest thing in the panel. */}
        <div className="mt-3 flex items-baseline justify-between border-t border-dashed border-line-strong pt-3">
          <span className="text-sm text-ink-soft">
            {canPay ? "To pay" : "Total"}
          </span>
          <span className="numeric text-4xl font-semibold text-ink">{total}</span>
        </div>

        {stuck ? (
          /* ---------- Paid, but the move failed ---------- */
          <div className="mt-4 grid gap-3">
            <p
              role="alert"
              className="rounded-md bg-warning-soft-bg p-3 text-sm text-warning-soft-fg"
            >
              {stuck}
            </p>
            <Button size="lg" className="min-h-14 w-full" loading={pending} onClick={retryMove}>
              {pending ? "Trying again…" : "Try again"}
            </Button>
          </div>
        ) : canPay ? (
          /* ---------- Take the money ---------- */
          <div className="mt-4">
            <div
              role="group"
              aria-label="Payment method"
              className="grid grid-cols-2 gap-2"
            >
              {METHODS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  aria-pressed={method === m}
                  className={`min-h-12 rounded-md border text-sm font-medium transition-colors ${
                    method === m
                      ? "border-cta bg-cta text-cta-fg"
                      : "border-line-strong bg-card text-ink-soft hover:border-ink hover:text-ink"
                  }`}
                >
                  {PAYMENT_METHOD_LABELS[m]}
                </button>
              ))}
            </div>

            {method === "cash" && (
              <>
                {/* As many columns as there are amounts, so a large total
                    (fewer notes above it) never leaves an empty slot. */}
                <div
                  className="mt-3 grid gap-2"
                  style={{ gridTemplateColumns: `repeat(${quickCash.length}, minmax(0, 1fr))` }}
                  role="group"
                  aria-label="Quick cash received"
                >
                  {quickCash.map((amount, i) => (
                    <button
                      key={amount}
                      type="button"
                      aria-pressed={tendered === String(amount)}
                      onClick={() => setTendered(String(amount))}
                      className={`numeric min-h-12 rounded-md border px-1 text-sm transition-colors ${
                        tendered === String(amount)
                          ? "border-ink bg-ink text-surface"
                          : "border-line-strong bg-card text-ink hover:bg-raised"
                      }`}
                    >
                      {i === 0 ? "Exact" : formatPrice(amount).replace(".00", "")}
                    </button>
                  ))}
                </div>

                <label
                  htmlFor={`tendered-${order.id}`}
                  className="mt-3 block text-sm text-ink-soft"
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
                  placeholder="0.00"
                  aria-invalid={tendered !== "" && !cashValid}
                  aria-describedby={`change-${order.id}`}
                  className={`${field} numeric mt-1 w-full text-base`}
                />

                {/* Words carry the state ("Short"), not only the colour. */}
                <p
                  id={`change-${order.id}`}
                  aria-live="polite"
                  className="mt-3 flex items-baseline justify-between gap-3"
                >
                  {change === null ? (
                    <>
                      <span className="text-sm text-ink-soft">Change</span>
                      <span className="numeric text-lg font-semibold text-muted">—</span>
                    </>
                  ) : change < 0 ? (
                    <>
                      <span className="text-sm text-danger">
                        Short · ask for {formatPrice(Math.abs(change))} more
                      </span>
                      <span className="numeric text-lg font-semibold text-danger">
                        {formatPrice(Math.abs(change))}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-sm text-ink-soft">Change</span>
                      <span className="numeric text-lg font-semibold text-success">
                        {formatPrice(change)}
                      </span>
                    </>
                  )}
                </p>
              </>
            )}

            {method === "ewallet" && (
              <p className="mt-3 text-sm text-ink-soft">
                Check that the transfer arrived before recording payment.
              </p>
            )}

            <Button
              size="lg"
              className="mt-4 min-h-14 w-full"
              loading={pending}
              disabled={!cashValid}
              onClick={() => pay(true)}
            >
              {pending ? "Recording…" : primaryLabel}
            </Button>

            {then && (
              <button
                type="button"
                onClick={() => pay(false)}
                disabled={pending || !cashValid}
                className="mt-1 min-h-11 w-full text-sm text-ink-soft underline underline-offset-4 transition-colors hover:text-ink disabled:no-underline disabled:opacity-45"
              >
                Record payment only
              </button>
            )}
          </div>
        ) : (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-ink-soft">
              {order.status === "cancelled" && isUnpaid
                ? "Cancelled · no payment due"
                : PAYMENT_STATUS_LABELS[order.payment_status]}{" "}
              · {PAYMENT_METHOD_LABELS[order.payment_method].toLowerCase()}
              {order.paid_at && (
                <>
                  {" "}
                  at{" "}
                  <time dateTime={order.paid_at}>{formatTime(order.paid_at)}</time>
                </>
              )}
            </p>
            {order.payment_status === "paid" && (
              <a
                href={`/staff/pos/receipt/${order.id}`}
                target="_blank"
                rel="noreferrer"
                className="ui-caps inline-flex min-h-11 items-center rounded-md border border-line-strong px-3 text-2xs text-ink-soft transition-colors hover:border-ink hover:text-ink"
              >
                Issue receipt
              </a>
            )}
          </div>
        )}

        {/* ---------- Corrections (folded away) ---------- */}
        {!stuck && (canPay || order.payment_status === "paid") && (
          <div className="mt-4 border-t border-line pt-2">
            <button
              type="button"
              onClick={() => setShowAdjust((v) => !v)}
              aria-expanded={showAdjust}
              aria-controls={`adjust-${order.id}`}
              className="min-h-11 text-sm text-ink-soft underline underline-offset-4 transition-colors hover:text-ink"
            >
              {showAdjust ? "Hide corrections" : "Discount, refund or void"}
            </button>

            {showAdjust && (
              <div id={`adjust-${order.id}`} className="mt-2 grid gap-3">
                {canPay && (
                  <form
                    className="grid gap-2 rounded-md border border-line-strong p-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      run(
                        () =>
                          applyManualDiscount(order.id, Number(discount), discountReason),
                        `${code} · discount applied`,
                      );
                    }}
                  >
                    <p className="text-sm font-medium text-ink">Discount</p>
                    <div className="flex flex-wrap gap-2">
                      <input
                        type="number"
                        min="0.01"
                        max={order.total_amount}
                        step="0.01"
                        required
                        value={discount}
                        onChange={(e) => setDiscount(e.target.value)}
                        placeholder="Amount"
                        aria-label="Discount amount"
                        className={`${field} numeric w-28`}
                      />
                      <input
                        required
                        value={discountReason}
                        onChange={(e) => setDiscountReason(e.target.value)}
                        placeholder="Reason"
                        aria-label="Reason for the discount"
                        className={`${field} min-w-0 flex-1`}
                      />
                      <Button type="submit" variant="outline" disabled={pending}>
                        Apply
                      </Button>
                    </div>
                  </form>
                )}

                {order.payment_status === "paid" && (
                  <form
                    className="grid gap-2 rounded-md border border-line-strong p-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      setConfirmRefund(true);
                    }}
                  >
                    <label htmlFor={`refund-reason-${order.id}`} className="text-sm font-medium text-ink">
                      Refund
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <input
                        id={`refund-reason-${order.id}`}
                        value={refundReason}
                        required
                        maxLength={280}
                        onChange={(e) => setRefundReason(e.target.value)}
                        placeholder="Reason"
                        className={`${field} min-w-0 flex-1`}
                      />
                      <Button type="submit" variant="danger" disabled={pending}>
                        Refund
                      </Button>
                    </div>
                  </form>
                )}

                <form
                  className="grid gap-2 rounded-md border border-danger/50 p-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setConfirmVoid(true);
                  }}
                >
                  <label htmlFor={`void-reason-${order.id}`} className="text-sm font-medium text-danger-soft-fg">
                    Void order
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <input
                      id={`void-reason-${order.id}`}
                      value={voidReason}
                      required
                      maxLength={280}
                      onChange={(e) => setVoidReason(e.target.value)}
                      placeholder="Reason"
                      className={`${field} min-w-0 flex-1`}
                    />
                    <Button
                      type="submit"
                      variant="danger"
                      disabled={pending || !voidReason.trim()}
                    >
                      Void
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </fieldset>

      <Modal
        open={confirmRefund}
        title="Refund order"
        body={`Refund ${code}? Return ${total} via ${PAYMENT_METHOD_LABELS[order.payment_method]}. Reason: ${refundReason}`}
        confirmLabel="Refund"
        cancelLabel="Cancel"
        danger
        onConfirm={() => {
          setConfirmRefund(false);
          run(() => refundOrder(order.id, null, refundReason), `${code} · refund recorded`);
        }}
        onCancel={() => setConfirmRefund(false)}
      />

      <Modal
        open={confirmVoid}
        title="Void order"
        body={`Void ${code}? ${isUnpaid ? "No money is returned for an unpaid order." : `Return ${total} via ${PAYMENT_METHOD_LABELS[order.payment_method]}.`} Reason: ${voidReason}`}
        confirmLabel="Void order"
        cancelLabel="Cancel"
        danger
        onConfirm={() => {
          setConfirmVoid(false);
          run(() => voidOrder(order.id, voidReason), `${code} · voided`);
        }}
        onCancel={() => setConfirmVoid(false)}
      />
    </article>
  );
}

"use client";

import { useEffect, useState, useTransition } from "react";
import toast from "react-hot-toast";
import { advanceOrderStatus, takePayment } from "@/app/actions/staff";
import { formatPrice, orderCode } from "@/lib/format";
import { PAYMENT_METHOD_LABELS } from "@/lib/order-meta";
import type { PaymentMethod } from "@/types/database";
import type { QueueOrder } from "@/types/staff";

/**
 * Hand-over with the payment folded in: the customer is at the counter, the
 * barista takes the money and hands the drink over in ONE step — no trip to
 * the POS tab. It calls the same server actions the POS uses (takePayment,
 * then advanceOrderStatus → completed), so the "pay before hand-over" rule
 * stays enforced by the API, not by this screen.
 *
 * Beside the table from `lg`; a bottom sheet over a scrim below that. Esc and
 * the labelled close both dismiss it; nothing is recorded until the one
 * primary button is pressed.
 */
export function HandOverPanel({ order, onClose }: { order: QueueOrder; onClose: () => void }) {
  const [method, setMethod] = useState<PaymentMethod>(order.payment_method);
  const [tendered, setTendered] = useState<number | null>(null);
  const [pending, startTransition] = useTransition();
  const total = order.total_amount;
  const customer = order.profiles?.full_name?.trim() || "Walk-in";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Exact, then the next notes a customer is likely to hand over.
  const quick = [total, ...[100, 200, 500, 1000].filter((n) => n > total)].slice(0, 4);
  const change = method === "cash" && tendered !== null ? tendered - total : null;
  const short = change !== null && change < 0;

  function confirm() {
    startTransition(async () => {
      const paid = await takePayment(order.id, method, null, "");
      if (paid.error) return void toast.error(paid.error);
      const done = await advanceOrderStatus(order.id, "completed");
      if (done.error) return void toast.error(`Paid, but not handed over: ${done.error}`);
      toast.success(`${orderCode(order.id)} · paid ${formatPrice(total)} · handed over`);
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-scrim sm:items-center sm:p-4">
      <section
        role="dialog"
        aria-labelledby="handover-title"
        className="relative grid max-h-[88vh] w-full gap-3 overflow-auto rounded-t-3xl bg-card p-5 pb-7 ring-1 ring-line sm:max-w-md sm:rounded-2xl sm:pb-5"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close hand-over panel"
          className="absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-xl border border-line-strong text-ink hover:bg-raised"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>

        <div className="pr-14">
          <p className="eyebrow text-muted">Hand over</p>
          <h2 id="handover-title" className="display mt-1 text-3xl leading-none text-ink">
            {orderCode(order.id)} · {customer}
          </h2>
        </div>

        <div className="flex items-baseline justify-between border-b border-dashed border-line-strong py-2">
          <span className="text-ink-soft">Total</span>
          <span className="display text-3xl text-ink">{formatPrice(total)}</span>
        </div>

        <div role="radiogroup" aria-label="Payment method" className="grid grid-cols-2 gap-1.5 rounded-2xl bg-raised p-1.5">
          {(["cash", "ewallet"] as PaymentMethod[]).map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={method === m}
              onClick={() => setMethod(m)}
              className={`ui-caps min-h-12 rounded-xl text-xs ${
                method === m ? "bg-card text-ink ring-2 ring-ink" : "text-ink-soft hover:text-ink"
              }`}
            >
              {PAYMENT_METHOD_LABELS[m]}
            </button>
          ))}
        </div>

        {method === "cash" && (
          <>
            <p className="eyebrow text-muted">Cash received</p>
            <div className="grid grid-cols-4 gap-1.5">
              {quick.map((amount, i) => (
                <button
                  key={amount}
                  type="button"
                  aria-pressed={tendered === amount}
                  onClick={() => setTendered(amount)}
                  className={`numeric min-h-11 rounded-xl border text-sm ${
                    tendered === amount ? "border-ink bg-ink text-surface" : "border-line-strong bg-card text-ink hover:bg-raised"
                  }`}
                >
                  {i === 0 ? "Exact" : formatPrice(amount).replace(".00", "")}
                </button>
              ))}
            </div>
            <div className="flex items-baseline justify-between border-b border-dashed border-line-strong py-2" aria-live="polite">
              <span className="text-ink-soft">Change</span>
              <span className={`display text-3xl ${short ? "text-danger" : "text-success"}`}>
                {change === null ? "—" : short ? `Short ${formatPrice(-change)}` : formatPrice(change)}
              </span>
            </div>
          </>
        )}

        <button
          type="button"
          onClick={confirm}
          disabled={pending || short}
          aria-busy={pending}
          className="ui-caps inline-flex min-h-16 w-full items-center justify-center gap-2.5 rounded-2xl bg-cta text-sm text-cta-fg transition-colors hover:bg-cta-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending && <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />}
          {pending ? "Recording…" : `Paid ${formatPrice(total)} · hand over`}
        </button>
        <button type="button" onClick={onClose} className="min-h-12 text-sm text-ink-soft underline underline-offset-4 hover:text-ink">
          Not here yet — keep it on the shelf
        </button>
      </section>
    </div>
  );
}

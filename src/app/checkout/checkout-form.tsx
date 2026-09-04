"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useCart, lineKey } from "@/lib/cart-context";
import { formatPrice } from "@/lib/format";
import { getSizeOption } from "@/lib/sizes";
import { Button, ButtonLink } from "@/components/ui/button";
import { CheckerBand } from "@/components/ui/checker";
import { placeOrder } from "@/app/actions/orders";
import { checkPromoCode } from "@/app/actions/promotions";
import {
  ORDER_TYPE_HINTS,
  ORDER_TYPE_LABELS,
  PAYMENT_METHOD_HINTS,
  PAYMENT_METHOD_LABELS,
  formatWait,
} from "@/lib/order-meta";
import type {
  OrderType,
  OrderingSettings,
  PaymentMethod,
  PaymentMethodSettings,
  PromoVerdict,
} from "@/types/database";

/**
 * Checkout.
 *
 * Four decisions, in the order a customer actually makes them: where they are
 * eating, how they will pay, whether they have a code, and then confirm. Each
 * is its own labelled card so nothing is buried, and the running total is
 * restated at the bottom next to the button that commits it.
 *
 * THE DISCOUNT SHOWN HERE IS A QUOTE, NOT A PROMISE. `checkPromoCode` calls the
 * same `evaluate_promo` the server calls when the order is created, so the two
 * agree — but the authoritative calculation happens inside `create_order`
 * against a subtotal the server derives itself. If a code is claimed by
 * someone else between the quote and the confirm, the order is refused with a
 * message rather than placed at a price the customer did not agree to.
 */
export function CheckoutForm({
  paymentMethods,
  ordering,
  estimatedMinutes,
}: {
  paymentMethods: PaymentMethodSettings;
  ordering: OrderingSettings;
  estimatedMinutes: number;
}) {
  const { lines, totalPrice, totalItems, clear, hydrated } = useCart();
  const router = useRouter();

  const availableTypes = (
    [
      ordering.takeout_enabled ? "takeout" : null,
      ordering.dine_in_enabled ? "dine_in" : null,
    ] as (OrderType | null)[]
  ).filter((t): t is OrderType => t !== null);

  const availableMethods = (
    Object.keys(paymentMethods) as PaymentMethod[]
  ).filter((m) => paymentMethods[m]);

  const [orderType, setOrderType] = useState<OrderType>(availableTypes[0] ?? "takeout");
  const [tableLabel, setTableLabel] = useState("");
  const [method, setMethod] = useState<PaymentMethod>(availableMethods[0] ?? "cash");
  const [pickupNote, setPickupNote] = useState("");

  const [codeInput, setCodeInput] = useState("");
  const [verdict, setVerdict] = useState<PromoVerdict | null>(null);
  const [checking, startChecking] = useTransition();

  const [error, setError] = useState<string | null>(null);
  const [placing, startPlacing] = useTransition();

  // The cart lives in localStorage, so the server renders it empty. Showing a
  // placeholder until hydration avoids flashing "nothing to check out" at
  // someone who has a full cart.
  if (!hydrated) {
    return (
      <div className="flex flex-col gap-4">
        <div className="skeleton h-40 rounded-lg" />
        <div className="skeleton h-32 rounded-lg" />
        <div className="skeleton h-12 rounded-full" />
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="py-12 text-center">
        <h2 className="text-xl font-semibold tracking-tight text-ink">
          Nothing to check out
        </h2>
        <p className="mt-2 text-sm text-muted">Your cart is empty.</p>
        <div className="mt-6 flex justify-center">
          <ButtonLink href="/" size="lg">
            Browse the menu
          </ButtonLink>
        </div>
      </div>
    );
  }

  if (!ordering.accepting_orders) {
    return (
      <div className="rounded-lg border border-warning-soft-fg/25 bg-warning-soft-bg px-6 py-10 text-center">
        <h2 className="text-xl font-semibold text-warning-soft-fg">
          We have paused new orders
        </h2>
        <p className="mx-auto mt-2 max-w-[44ch] text-sm text-warning-soft-fg">
          The shop is not taking orders at the moment. Your cart is saved — come
          back shortly and it will still be here.
        </p>
        <div className="mt-6 flex justify-center">
          <ButtonLink href="/" variant="outline" size="lg">
            Back to the menu
          </ButtonLink>
        </div>
      </div>
    );
  }

  const discount = verdict?.valid ? verdict.discount : 0;
  const dueNow = Math.max(0, totalPrice - discount);

  function applyCode() {
    const code = codeInput.trim();
    if (!code) return;

    startChecking(async () => {
      const result = await checkPromoCode(code, totalPrice);
      setVerdict(result);
      if (result.valid) toast.success(result.message);
    });
  }

  function submit() {
    setError(null);
    startPlacing(async () => {
      const result = await placeOrder({
        items: lines.map((l) => ({
          menuItemId: l.menuItemId,
          quantity: l.quantity,
          size: l.size,
        })),
        pickupNote,
        orderType,
        paymentMethod: method,
        // Only sent when the quote came back valid — sending a rejected code
        // would make create_order refuse the whole order.
        promoCode: verdict?.valid ? codeInput.trim() : "",
        tableLabel: orderType === "dine_in" ? tableLabel : "",
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      clear();
      toast.success("Order placed.");
      router.push(`/orders/${result.orderId}`);
    });
  }

  return (
    <div className="flex flex-col gap-5">
      {/* ---------- 1. Where ---------- */}
      {availableTypes.length > 1 && (
        <Card title="Where are you having it?">
          <div className="flex flex-col gap-2 sm:flex-row">
            {availableTypes.map((type) => (
              <label
                key={type}
                className={`flex flex-1 cursor-pointer flex-col gap-1 rounded-md border p-3.5 transition-colors duration-150 ease-hi ${
                  orderType === type
                    ? "border-accent bg-accent-soft"
                    : "border-line-strong bg-card hover:border-ink-soft"
                }`}
              >
                <span className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="order_type"
                    value={type}
                    checked={orderType === type}
                    onChange={() => setOrderType(type)}
                    className="h-4 w-4 accent-[var(--hi-accent)]"
                  />
                  <span className="text-sm font-semibold text-ink">
                    {ORDER_TYPE_LABELS[type]}
                  </span>
                </span>
                <span className="pl-6 text-xs text-muted">
                  {ORDER_TYPE_HINTS[type]}
                </span>
              </label>
            ))}
          </div>

          {orderType === "dine_in" && (
            <div className="mt-4 flex flex-col gap-1.5">
              <label htmlFor="table_label" className="text-sm font-medium text-ink-soft">
                Table <span className="font-normal text-muted">(optional)</span>
              </label>
              <input
                id="table_label"
                value={tableLabel}
                onChange={(e) => setTableLabel(e.target.value)}
                maxLength={40}
                placeholder="e.g. 4, or by the window"
                aria-describedby="table_label-hint"
                className="rounded-md border border-line-strong bg-card px-3 py-2.5 text-sm text-ink placeholder:text-muted transition-colors duration-150 ease-hi hover:border-ink-soft focus:border-ink"
              />
              <p id="table_label-hint" className="text-xs text-muted">
                Tell us where you are sitting and we will bring it over. Leave it
                blank and we will find you.
              </p>
            </div>
          )}
        </Card>
      )}

      {/* ---------- 2. How ---------- */}
      <Card
        title="How would you like to pay?"
        hint="Payment is taken at the counter — nothing is charged now."
      >
        <div className="flex flex-col gap-2">
          {availableMethods.map((m) => (
            <label
              key={m}
              className={`flex cursor-pointer items-start gap-2.5 rounded-md border p-3.5 transition-colors duration-150 ease-hi ${
                method === m
                  ? "border-accent bg-accent-soft"
                  : "border-line-strong bg-card hover:border-ink-soft"
              }`}
            >
              <input
                type="radio"
                name="payment_method"
                value={m}
                checked={method === m}
                onChange={() => setMethod(m)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--hi-accent)]"
              />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-ink">
                  {PAYMENT_METHOD_LABELS[m]}
                </span>
                <span className="block text-xs text-muted">
                  {PAYMENT_METHOD_HINTS[m]}
                </span>
              </span>
            </label>
          ))}
        </div>
      </Card>

      {/* ---------- 3. Promo ---------- */}
      <Card title="Have a code?">
        <div className="flex flex-wrap gap-2">
          <label htmlFor="promo_code" className="sr-only">
            Promotional code
          </label>
          <input
            id="promo_code"
            value={codeInput}
            onChange={(e) => {
              setCodeInput(e.target.value);
              // Clearing the verdict on edit stops a stale "applied" message
              // sitting under a code that has since been changed.
              if (verdict) setVerdict(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyCode();
              }
            }}
            placeholder="WELCOME10"
            aria-describedby="promo-feedback"
            className="min-w-0 flex-1 rounded-md border border-line-strong bg-card px-3 py-2.5 text-sm uppercase text-ink placeholder:normal-case placeholder:text-muted transition-colors duration-150 ease-hi hover:border-ink-soft focus:border-ink"
          />
          <Button
            variant="secondary"
            onClick={applyCode}
            disabled={checking || codeInput.trim() === ""}
          >
            {checking ? "Checking…" : "Apply"}
          </Button>
        </div>

        {/* aria-live so the verdict is announced when it arrives, not only
            found by someone who tabs back. */}
        <p id="promo-feedback" aria-live="polite" className="mt-2 text-sm">
          {verdict && (
            <span
              className={
                verdict.valid ? "font-medium text-success" : "font-medium text-danger"
              }
            >
              {verdict.valid
                ? `${verdict.message} You save ${formatPrice(verdict.discount)}.`
                : verdict.message}
            </span>
          )}
        </p>
      </Card>

      {/* ---------- 4. Notes ---------- */}
      <Card title="Anything we should know?">
        <label htmlFor="pickup_note" className="sr-only">
          Notes for the shop
        </label>
        <textarea
          id="pickup_note"
          value={pickupNote}
          onChange={(e) => setPickupNote(e.target.value)}
          rows={3}
          maxLength={280}
          placeholder="e.g. less ice, oat milk, or a pickup time"
          className="w-full rounded-md border border-line-strong bg-card px-3 py-2.5 text-sm text-ink placeholder:text-muted transition-colors duration-150 ease-hi hover:border-ink-soft focus:border-ink"
        />
        <p className="mt-1.5 text-xs text-muted">
          Allergies and dietary needs go here — the person making your drink
          sees this on the ticket.
        </p>
      </Card>

      {/* ---------- Summary ---------- */}
      <section
        aria-labelledby="summary-heading"
        className="overflow-hidden rounded-lg border border-line bg-card"
      >
        <CheckerBand size="sm" className="h-1.5" />

        <div className="p-5">
          <h2
            id="summary-heading"
            className="text-2xs font-semibold uppercase tracking-[0.16em] text-muted"
          >
            Your order
          </h2>

          <ul className="mt-4 flex flex-col gap-2.5 text-sm">
            {lines.map((line) => (
              <li
                key={lineKey(line.menuItemId, line.size)}
                className="flex justify-between gap-4"
              >
                <span className="min-w-0 text-ink-soft">
                  {line.quantity} &times; {line.name}{" "}
                  <span className="text-muted">
                    ({getSizeOption(line.size).label})
                  </span>
                </span>
                <span className="shrink-0 tabular-nums text-ink">
                  {formatPrice(line.price * line.quantity)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="mt-4 flex flex-col gap-1.5 border-t border-line pt-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Subtotal</dt>
              <dd className="tabular-nums text-ink-soft">{formatPrice(totalPrice)}</dd>
            </div>

            {discount > 0 && (
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Discount ({verdict?.code})</dt>
                <dd className="tabular-nums text-success">−{formatPrice(discount)}</dd>
              </div>
            )}

            <div className="mt-1.5 flex items-center justify-between gap-4 border-t border-line pt-3">
              <dt className="text-base font-medium text-ink-soft">Total</dt>
              <dd className="text-xl font-semibold tabular-nums text-ink">
                {formatPrice(dueNow)}
              </dd>
            </div>
          </dl>

          <p className="mt-4 rounded-md bg-raised px-3 py-2.5 text-sm text-ink-soft">
            {ORDER_TYPE_LABELS[orderType]} &middot;{" "}
            {PAYMENT_METHOD_LABELS[method].toLowerCase()} at the counter &middot;
            ready in {formatWait(estimatedMinutes)}
          </p>

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-md border border-danger/40 bg-danger-soft-bg px-3 py-2.5 text-sm font-medium text-danger-soft-fg"
            >
              {error}
            </p>
          )}

          <Button
            size="lg"
            className="mt-5 w-full"
            onClick={submit}
            disabled={placing}
          >
            {placing
              ? "Placing your order…"
              : `Place order · ${formatPrice(dueNow)}`}
          </Button>

          <p className="mt-3 text-center text-xs text-muted">
            {totalItems} {totalItems === 1 ? "item" : "items"}. You can cancel
            while the order is still pending.
          </p>
        </div>
      </section>
    </div>
  );
}

/** One labelled step. Keeps the four cards on the same padding and rhythm. */
function Card({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-line bg-card p-5">
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

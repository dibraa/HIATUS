"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useCart, lineKey } from "@/lib/cart-context";
import { formatPrice } from "@/lib/format";
import { getSizeOption } from "@/lib/sizes";
import { Button, ButtonLink } from "@/components/ui/button";
import { placeOrder } from "@/app/actions/orders";

export default function CheckoutPage() {
  const { lines, totalPrice, totalItems, clear, hydrated } = useCart();
  const [pickupNote, setPickupNote] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-lg">
        <div className="skeleton h-8 w-36 rounded-md" />
        <div className="skeleton mt-6 h-56 rounded-lg" />
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Nothing to check out</h1>
        <p className="mt-2 text-sm text-muted">Your cart is empty.</p>
        <div className="mt-6 flex justify-center">
          <ButtonLink href="/" size="lg">
            Browse the menu
          </ButtonLink>
        </div>
      </div>
    );
  }

  const handlePlaceOrder = () => {
    setError(null);
    startTransition(async () => {
      const result = await placeOrder(
        lines.map((l) => ({
          menuItemId: l.menuItemId,
          quantity: l.quantity,
          size: l.size,
        })),
        pickupNote
      );

      if (result.error) {
        setError(result.error);
        return;
      }

      clear();
      toast.success("Order placed. Pay cash on pickup.");
      router.push(`/orders/${result.orderId}`);
    });
  };

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Checkout</h1>
      <p className="mt-1 text-sm text-muted">
        {totalItems} {totalItems === 1 ? "item" : "items"} for pickup
      </p>

      <div className="mt-6 rounded-lg border border-line bg-card p-5">
        <h2 className="text-2xs font-semibold uppercase tracking-[0.16em] text-muted">
          Order summary
        </h2>

        <ul className="mt-4 flex flex-col gap-2.5 text-sm">
          {lines.map((line) => (
            <li key={lineKey(line.menuItemId, line.size)} className="flex justify-between gap-4">
              <span className="min-w-0 text-ink-soft">
                {line.quantity} &times; {line.name}{" "}
                <span className="text-muted">({getSizeOption(line.size).label})</span>
              </span>
              <span className="shrink-0 tabular-nums text-ink">
                {formatPrice(line.price * line.quantity)}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex items-center justify-between border-t border-line pt-4 text-base">
          <span className="font-medium text-ink-soft">Total</span>
          <span className="text-lg font-semibold tabular-nums text-ink">
            {formatPrice(totalPrice)}
          </span>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-line bg-raised px-4 py-3 text-sm text-ink-soft">
        <span className="font-medium text-ink">Payment:</span> cash on pickup. Please
        have the exact amount ready.
      </div>

      <div className="mt-6 flex flex-col gap-1.5">
        <label htmlFor="pickup_note" className="text-sm font-medium text-ink">
          Notes for the shop <span className="font-normal text-muted">(optional)</span>
        </label>
        <textarea
          id="pickup_note"
          value={pickupNote}
          onChange={(e) => setPickupNote(e.target.value)}
          rows={3}
          maxLength={280}
          className="rounded-md border border-line-strong bg-card px-3 py-2 text-sm text-ink placeholder:text-muted transition-colors duration-150 ease-hi hover:border-ink focus:border-ink focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          placeholder="e.g. less ice, or a pickup time"
        />
      </div>

      {error && (
        // role="alert" so the failure is announced rather than only seen
        <p role="alert" className="mt-4 rounded-md border border-danger/30 bg-card px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <Button
        size="lg"
        className="mt-6 w-full"
        onClick={handlePlaceOrder}
        disabled={pending}
      >
        {pending ? "Placing order…" : `Place order · ${formatPrice(totalPrice)}`}
      </Button>

      <p className="mt-3 text-center text-xs text-muted">
        You can cancel while the order is still pending.
      </p>
    </div>
  );
}

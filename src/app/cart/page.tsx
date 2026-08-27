"use client";

import Link from "next/link";
import { useCart, lineKey } from "@/lib/cart-context";
import { formatPrice } from "@/lib/format";
import { getSizeOption } from "@/lib/sizes";
import { ProductImage } from "@/components/ui/product-image";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { ButtonLink } from "@/components/ui/button";

export default function CartPage() {
  const { lines, setQuantity, removeItem, totalPrice, totalItems, hydrated } = useCart();

  // The cart lives in localStorage, so the server renders it empty. Showing a
  // placeholder until hydration avoids flashing "your cart is empty" at
  // someone who has a full cart.
  if (!hydrated) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="skeleton h-8 w-40 rounded-md" />
        <div className="mt-6 flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-24 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Your cart is empty</h1>
        <p className="mt-2 text-sm text-muted">
          Add a drink from the menu and it will show up here.
        </p>
        <div className="mt-6 flex justify-center">
          <ButtonLink href="/" size="lg">
            Browse the menu
          </ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Your cart</h1>
      <p className="mt-1 text-sm text-muted">
        {totalItems} {totalItems === 1 ? "item" : "items"}
      </p>

      <ul className="mt-6 flex flex-col gap-3">
        {lines.map((line) => {
          const key = lineKey(line.menuItemId, line.size);
          const sizeLabel = getSizeOption(line.size).label;
          // Size is part of the identity of the line, so it belongs in every
          // accessible name that refers to it
          const fullLabel = `${line.name} (${sizeLabel})`;

          return (
            <li
              key={key}
              className="flex items-start gap-3 rounded-lg border border-line bg-card p-3 sm:gap-4"
            >
              <div className="w-16 shrink-0 sm:w-20">
                <ProductImage
                  src={line.imageUrl}
                  alt={line.name}
                  sizes="80px"
                  rounded="rounded-md"
                />
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <Link
                  href={`/menu/${line.menuItemId}`}
                  className="text-sm font-semibold text-ink underline-offset-4 hover:underline"
                >
                  {line.name}
                </Link>
                <p className="text-2xs uppercase tracking-[0.14em] text-muted">
                  {line.flavor} &middot; {sizeLabel}
                </p>
                <p className="text-sm tabular-nums text-ink-soft">
                  {formatPrice(line.price)} each
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <QuantityStepper
                    value={line.quantity}
                    onChange={(next) => setQuantity(key, next)}
                    itemLabel={fullLabel}
                    size="sm"
                  />
                  <button
                    type="button"
                    className="text-xs font-medium text-muted underline underline-offset-4 transition-colors duration-150 ease-hi hover:text-danger"
                    onClick={() => removeItem(key)}
                  >
                    Remove<span className="sr-only"> {fullLabel} from cart</span>
                  </button>
                </div>
              </div>

              <p className="shrink-0 text-sm font-semibold tabular-nums text-ink">
                {formatPrice(line.price * line.quantity)}
              </p>
            </li>
          );
        })}
      </ul>

      <div className="mt-6 rounded-lg border border-line bg-card p-5">
        <div className="flex items-center justify-between text-base">
          <span className="text-ink-soft">Subtotal</span>
          <span className="font-semibold tabular-nums text-ink">{formatPrice(totalPrice)}</span>
        </div>
        <p className="mt-1 text-xs text-muted">
          Pickup only — no delivery fee. Pay cash when you collect.
        </p>

        <ButtonLink href="/checkout" size="lg" className="mt-5 w-full">
          Proceed to checkout
        </ButtonLink>

        <Link
          href="/"
          className="mt-3 block text-center text-xs font-medium text-ink-soft underline underline-offset-4 transition-colors duration-150 ease-hi hover:text-ink"
        >
          Continue shopping
        </Link>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/format";
import { DEFAULT_SIZE, getSizeOption, priceForSize, type DrinkSize } from "@/lib/sizes";
import { SizeSelector } from "@/components/ui/size-selector";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { Button } from "@/components/ui/button";
import type { MenuItem } from "@/types/database";

/**
 * The buy panel: size, quantity, live price, and the page's primary action.
 *
 * Price lives here rather than in the server-rendered page above because it
 * depends on the chosen size — keeping one price on screen avoids the classic
 * bug where a static headline price contradicts the configured line total.
 */
export function AddToCart({ item }: { item: MenuItem }) {
  const { addItem } = useCart();
  const [size, setSize] = useState<DrinkSize>(DEFAULT_SIZE);
  const [quantity, setQuantity] = useState(1);

  const unitPrice = priceForSize(item.price, size);
  const lineTotal = unitPrice * quantity;
  const sizeLabel = getSizeOption(size).label;

  return (
    <div className="rounded-lg border border-line bg-card p-5">
      {/* Live region: price changes in response to controls below it */}
      <div aria-live="polite">
        <p className="text-3xl font-semibold tabular-nums text-ink">
          {formatPrice(unitPrice)}
          <span className="sr-only"> per {sizeLabel}</span>
        </p>
        {quantity > 1 && (
          <p className="mt-1 text-sm text-muted">
            {quantity} × {formatPrice(unitPrice)} ={" "}
            <span className="font-medium text-ink-soft">{formatPrice(lineTotal)}</span>
          </p>
        )}
      </div>

      <div className="mt-5">
        <SizeSelector
          value={size}
          onChange={setSize}
          name={item.id}
          disabled={!item.is_available}
        />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <QuantityStepper
          value={quantity}
          onChange={setQuantity}
          itemLabel={item.name}
        />

        <Button
          size="lg"
          className="min-w-[12rem] flex-1"
          disabled={!item.is_available}
          onClick={() => {
            addItem(
              {
                menuItemId: item.id,
                name: item.name,
                flavor: item.flavor,
                size,
                price: unitPrice,
                imageUrl: item.image_url,
              },
              quantity
            );
            toast.success(
              `${quantity} × ${item.name} (${sizeLabel}) added to cart`
            );
          }}
        >
          {item.is_available ? "Add to cart" : "Sold out"}
        </Button>
      </div>

      {!item.is_available && (
        // Text, not just a greyed-out button — disabled styling alone is not a
        // reliable signal, and colour must never be the only carrier of state.
        <p className="mt-3 text-sm text-danger">
          This drink is unavailable right now. Try another from the menu.
        </p>
      )}

      <ul className="mt-5 flex flex-col gap-1.5 border-t border-line pt-4 text-xs text-muted">
        <li>Pickup only — collect in store when it is ready</li>
        <li>Cash on pickup, no card needed</li>
      </ul>
    </div>
  );
}

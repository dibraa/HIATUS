"use client";

import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { lineKey, useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/format";
import { getSizeOption } from "@/lib/sizes";

/**
 * The order you are building, printed on a ticket — the same torn-edge
 * object as the log-in pages — beside the menu from `lg`. It reads the cart
 * live, so tapping + on a card shows up here at once; editing quantities
 * stays on /cart, which this links to.
 */
export function TicketRail() {
  const { lines, totalItems, totalPrice, hydrated } = useCart();

  return (
    <div className="ticket-edges bg-card px-5 pb-5 pt-7">
      <div className="flex items-baseline justify-between gap-3 border-b-[1.5px] border-dashed border-line-strong pb-3">
        <span className="ui-caps text-2xs text-muted">Your ticket</span>
        <span className="display text-xl text-ink">
          {hydrated ? `${totalItems} ${totalItems === 1 ? "item" : "items"}` : "…"}
        </span>
      </div>

      {!hydrated ? (
        <div className="skeleton my-4 h-16 rounded-md" aria-hidden="true" />
      ) : lines.length === 0 ? (
        <p className="py-6 text-sm text-muted">
          Nothing on it yet. Tap <span className="font-semibold text-ink">+</span> on a drink to start.
        </p>
      ) : (
        <>
          <ul>
            {lines.map((line) => (
              <li
                key={lineKey(line.menuItemId, line.size)}
                className="grid grid-cols-[1.75rem_minmax(0,1fr)_auto] gap-2 border-b border-line py-3 text-sm"
              >
                <span className="numeric text-muted">{line.quantity}×</span>
                <span className="min-w-0">
                  <span className="block truncate text-ink">{line.name}</span>
                  <span className="block text-xs text-muted">{getSizeOption(line.size).label}</span>
                </span>
                <span className="numeric text-ink">{formatPrice(line.price * line.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between py-3.5 font-semibold text-ink">
            <span>Total</span>
            <span className="numeric">{formatPrice(totalPrice)}</span>
          </div>
          <div className="grid gap-2">
            <ButtonLink href="/checkout" size="lg" className="w-full">
              Checkout
            </ButtonLink>
            <Link
              href="/cart"
              className="ui-caps inline-flex min-h-11 items-center justify-center text-2xs text-ink-soft underline-offset-4 hover:text-ink hover:underline"
            >
              Edit ticket
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * Below `lg`: the same ticket folded into a bar pinned to the bottom, shown
 * only once something is on it. It sits ABOVE the phone tab bar (whose height
 * it clears with `bottom-[...]`), and /menu adds a matching spacer so the
 * last row of drinks is never hidden behind either. `inverse-card`, not
 * `cta`: the CTA token turns cream in dark mode, and so would the button on it.
 */
export function TicketBar() {
  const { totalItems, totalPrice, hydrated } = useCart();
  if (!hydrated || totalItems === 0) return null;

  return (
    <div className="fixed inset-x-3 bottom-[calc(var(--tabbar-h,0px)+0.75rem)] z-30 flex items-center justify-between gap-3 rounded-2xl bg-inverse-card py-2 pl-5 pr-2 text-inverse-card-fg ring-1 ring-line lg:hidden">
      <span className="ui-caps text-2xs">
        Ticket · {totalItems} {totalItems === 1 ? "item" : "items"} ·{" "}
        <span className="numeric">{formatPrice(totalPrice)}</span>
      </span>
      <ButtonLink href="/checkout" variant="inverse" size="md">
        Checkout
      </ButtonLink>
    </div>
  );
}

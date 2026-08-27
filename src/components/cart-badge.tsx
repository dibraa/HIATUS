"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";

/**
 * Cart entry point with a live item count.
 *
 * The count only renders once the cart has hydrated from localStorage — the
 * server has no way to know it, so painting a "0" first would flash the wrong
 * number on every page load for anyone with a full cart.
 *
 * The accessible name carries the count too, so it is never conveyed by the
 * badge's position alone.
 */
export function CartBadge({ className = "" }: { className?: string }) {
  const { totalItems, hydrated } = useCart();
  const showCount = hydrated && totalItems > 0;

  return (
    <Link
      href="/cart"
      aria-label={
        showCount
          ? `Cart, ${totalItems} ${totalItems === 1 ? "item" : "items"}`
          : "Cart, empty"
      }
      className={`relative inline-flex h-10 items-center gap-2 rounded-full px-3 text-sm font-medium
                  text-ink transition-colors duration-150 ease-hi hover:bg-raised ${className}`}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <path d="M3 4h2.2l2.1 10.4a2 2 0 0 0 2 1.6h7.5a2 2 0 0 0 2-1.55L20.5 7H6" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="10" cy="20" r="1.4" />
        <circle cx="17.5" cy="20" r="1.4" />
      </svg>

      <span className="hidden sm:inline" aria-hidden="true">
        Cart
      </span>

      {showCount && (
        <span
          aria-hidden="true"
          className="absolute -right-0.5 -top-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1 text-2xs font-semibold tabular-nums text-accent-fg sm:static sm:ml-0.5"
        >
          {totalItems}
        </span>
      )}
    </Link>
  );
}

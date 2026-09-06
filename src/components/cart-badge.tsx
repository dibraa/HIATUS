"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";

/**
 * Cart entry point with a live item count.
 *
 * Set as `CART (2)` — the comp's own treatment, where the count is part of the
 * label rather than a superscript dot. That also removes the usual overlap
 * problem of a floating badge on a small target.
 *
 * The count only renders once the cart has hydrated from localStorage — the
 * server has no way to know it, so painting a "0" first would flash the wrong
 * number on every page load for anyone with a full cart. Below `sm` the label
 * collapses to the trolley glyph, where the header has no room for words.
 *
 * The accessible name carries the count either way, so it is never conveyed by
 * the parenthetical alone.
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
      className={`ui-caps relative inline-flex h-10 items-center gap-1.5 rounded-md px-2 text-2xs text-ink transition-colors hover:bg-raised ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5 sm:hidden"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        aria-hidden="true"
      >
        <path d="M3 4h2.2l2.1 10.4a2 2 0 0 0 2 1.6h7.5a2 2 0 0 0 2-1.55L20.5 7H6" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="10" cy="20" r="1.4" />
        <circle cx="17.5" cy="20" r="1.4" />
      </svg>

      <span className="hidden sm:inline" aria-hidden="true">
        Cart
      </span>

      {showCount && (
        <span aria-hidden="true" className="numeric text-2xs">
          ({totalItems})
        </span>
      )}
    </Link>
  );
}

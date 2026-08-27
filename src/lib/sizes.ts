/**
 * Drink sizes and their price modifiers.
 *
 * A menu item stores ONE price in `menu_items.price`; that price is the
 * MEDIUM. Small and large are derived from it via the deltas below, so the
 * shop keeps managing a single price per item in the admin UI.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ KEEP IN SYNC with `hiatus_size_delta()` in                           │
 * │ supabase/patches/001_size_pricing.sql.                               │
 * │                                                                      │
 * │ `create_order` re-derives every line price server-side so a client   │
 * │ cannot dictate what an order costs. That means the server needs the  │
 * │ same deltas — if these two drift, the cart will quote one total and  │
 * │ the order will record another.                                       │
 * └──────────────────────────────────────────────────────────────────────┘
 */

export type DrinkSize = "S" | "M" | "L";

export type SizeOption = {
  code: DrinkSize;
  /** Full name, used in cart lines, order summaries and screen-reader labels. */
  label: string;
  /** Shown as supporting detail so the choice is not just a letter. */
  volume: string;
  /** Added to the item's base (medium) price, in PHP. */
  priceDelta: number;
};

export const SIZE_OPTIONS: readonly SizeOption[] = [
  { code: "S", label: "Small", volume: "12 oz", priceDelta: -15 },
  { code: "M", label: "Medium", volume: "16 oz", priceDelta: 0 },
  { code: "L", label: "Large", volume: "22 oz", priceDelta: 25 },
] as const;

/** The size a product page opens on, and what pre-size cart lines migrate to. */
export const DEFAULT_SIZE: DrinkSize = "M";

export function getSizeOption(code: DrinkSize): SizeOption {
  return SIZE_OPTIONS.find((s) => s.code === code) ?? SIZE_OPTIONS[1];
}

/** Unit price of `basePrice` at `size`, floored at 0 so a delta can never invert a price. */
export function priceForSize(basePrice: number, size: DrinkSize): number {
  return Math.max(0, basePrice + getSizeOption(size).priceDelta);
}

/** Type guard for values arriving from localStorage or a URL. */
export function isDrinkSize(value: unknown): value is DrinkSize {
  return value === "S" || value === "M" || value === "L";
}

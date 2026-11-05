/**
 * Drink sizes and their price modifiers.
 *
 * A menu item stores its MEDIUM price in `menu_items.price`. Small and large
 * can override the shared defaults through the item's size pricing deltas.
 *
 * The Express order route re-derives every line price server-side so a client
 * cannot dictate what an order costs. The server and client must use the same
 * deltas or the cart will quote one total and the order will record another.
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

/** Unit price at `size`, floored at 0 so a delta can never invert a price. */
export function priceForSize(
  basePrice: number,
  size: DrinkSize,
  pricing?: Partial<Record<DrinkSize, number>> | null,
): number {
  const configuredDelta = pricing?.[size];
  return Math.max(0, basePrice + (typeof configuredDelta === "number" ? configuredDelta : getSizeOption(size).priceDelta));
}

/** Type guard for values arriving from localStorage or a URL. */
export function isDrinkSize(value: unknown): value is DrinkSize {
  return value === "S" || value === "M" || value === "L";
}

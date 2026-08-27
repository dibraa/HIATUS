"use client";

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import type { MenuItem } from "@/types/database";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/format";
import { DEFAULT_SIZE, getSizeOption, priceForSize, type DrinkSize } from "@/lib/sizes";
import { RatingSummary } from "@/components/star-rating";
import { ProductImage } from "@/components/ui/product-image";
import { SizeSelector } from "@/components/ui/size-selector";
import { Button } from "@/components/ui/button";

export type FeaturedItem = {
  item: MenuItem;
  averageRating: number | null;
  ratingCount: number;
};

/**
 * The storefront's hero product: a dark, high-contrast card that lets someone
 * configure and add a drink without leaving the landing page — the shortest
 * path from arrival to cart.
 *
 * Deliberately NOT autoplaying. An auto-advancing carousel moves a control out
 * from under the pointer and fails WCAG 2.2.2 unless it ships pause controls;
 * a manual prev/next has none of that cost and loses nothing here.
 */
export function FeaturedCarousel({ featured }: { featured: FeaturedItem[] }) {
  const [index, setIndex] = useState(0);

  if (featured.length === 0) return null;

  const current = featured[index];
  const count = featured.length;

  const go = (delta: number) => setIndex((i) => (i + delta + count) % count);

  return (
    <section
      aria-label="Featured drinks"
      className="relative flex flex-col overflow-hidden rounded-xl bg-inverse-bg p-5 text-inverse-fg shadow-lg sm:p-6"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-2xs font-semibold uppercase tracking-[0.18em] text-inverse-muted">
          Featured
        </p>

        {count > 1 && (
          <div className="flex items-center gap-1">
            {/* Position is announced politely so the change is perceivable
                without sight; the visible text carries the same information. */}
            <span className="mr-1 text-xs tabular-nums text-inverse-muted" aria-live="polite">
              {index + 1} / {count}
            </span>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Show previous featured drink"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-inverse-line transition-colors duration-150 ease-hi hover:bg-inverse-fg/10 focus-visible:outline-inverse-fg"
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
                <path d="M12.5 4L7 10l5.5 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Show next featured drink"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-inverse-line transition-colors duration-150 ease-hi hover:bg-inverse-fg/10 focus-visible:outline-inverse-fg"
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
                <path d="M7.5 4L13 10l-5.5 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* key= resets the size choice when a different drink is shown, so the
          price on screen always belongs to the drink on screen */}
      <FeaturedCard key={current.item.id} {...current} isLcp={index === 0} />
    </section>
  );
}

function FeaturedCard({
  item,
  averageRating,
  ratingCount,
  isLcp,
}: FeaturedItem & { isLcp: boolean }) {
  const { addItem } = useCart();
  const [size, setSize] = useState<DrinkSize>(DEFAULT_SIZE);

  const unitPrice = priceForSize(item.price, size);
  const sizeLabel = getSizeOption(size).label;

  return (
    <div className="grid flex-1 gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] sm:items-center sm:gap-6">
      <ProductImage
        src={item.image_url}
        alt={item.name}
        sizes="(min-width: 1024px) 240px, (min-width: 640px) 30vw, 80vw"
        priority={isLcp}
        rounded="rounded-lg"
        tone="dark"
        className="mx-auto max-w-[240px] sm:max-w-none"
      />

      <div className="flex min-w-0 flex-col">
        <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-inverse-muted">
          {item.flavor}
        </p>

        {/* h2: the page's h1 is the hero headline, and this must not skip a level */}
        <h2 className="mt-1 text-2xl font-semibold leading-tight text-inverse-fg">
          <Link
            href={`/menu/${item.id}`}
            className="hover:underline decoration-inverse-muted underline-offset-4 focus-visible:outline-inverse-fg"
          >
            {item.name}
          </Link>
        </h2>

        <div className="mt-2">
          <RatingSummary average={averageRating} count={ratingCount} tone="dark" />
        </div>

        {item.description && (
          // max-w keeps the measure near 60 characters at every width
          <p className="mt-3 max-w-[46ch] text-sm text-inverse-muted line-clamp-2">
            {item.description}
          </p>
        )}

        <div className="mt-5">
          <SizeSelector
            value={size}
            onChange={setSize}
            name={item.id}
            tone="dark"
            disabled={!item.is_available}
          />
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          {/* Live region: the price is the thing that changes when a size is
              picked, and that change happens away from the control. */}
          <p className="text-2xl font-semibold tabular-nums" aria-live="polite">
            {formatPrice(unitPrice)}
            <span className="sr-only"> for {sizeLabel}</span>
          </p>

          <Button
            variant="inverse"
            size="md"
            disabled={!item.is_available}
            className="min-w-[10rem] flex-1 sm:flex-none"
            onClick={() => {
              addItem({
                menuItemId: item.id,
                name: item.name,
                flavor: item.flavor,
                size,
                price: unitPrice,
                imageUrl: item.image_url,
              });
              toast.success(`${item.name} (${sizeLabel}) added to cart`);
            }}
          >
            {item.is_available ? "Add to cart" : "Sold out"}
          </Button>
        </div>
      </div>
    </div>
  );
}

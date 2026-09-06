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
import { CookiesDoodle } from "@/components/ui/doodles";

export type FeaturedItem = {
  item: MenuItem;
  averageRating: number | null;
  ratingCount: number;
};

/**
 * The pine feature panel — the comp's "Sips worth sharing".
 *
 * Its layering is the point, and it is built the way the reference draws it:
 * a sage display heading, a photograph laid over that heading so the second
 * line is partly covered, and an espresso caption card straddling the photo's
 * bottom edge. Depth from overlap, not from shadow.
 *
 * The overlaps are CONTAINER queries, not viewport ones. This panel is used
 * full-width on the home page and inside a half-width hero column on /demo,
 * and a viewport-keyed overlap put the caption straight over the heading in the
 * narrow case. Below the threshold the same three pieces run in sequence.
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
      aria-labelledby="featured-heading"
      className="@container relative overflow-hidden rounded-2xl bg-inverse-bg px-5 py-8 text-inverse-fg sm:px-8 sm:py-10"
    >
      {/* Marginalia, in the panel's own line colour so it reads as a drawing
          on the surface rather than as content on top of it. */}
      <CookiesDoodle className="doodle-inverse pointer-events-none absolute -right-8 -top-8 h-32 w-32 @2xl:h-52 @2xl:w-52" />

      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow text-inverse-muted">Featured</p>

          {/* Sage on pine is 3.11:1 — AA for large text and nothing smaller,
              which is why this token is named `inverse-display`. */}
          <h2
            id="featured-heading"
            className="display mt-3 max-w-[9ch] text-4xl text-inverse-display @2xl:text-5xl"
          >
            Sips worth sharing
          </h2>
        </div>

        {count > 1 && (
          <div className="flex items-center gap-1.5">
            {/* Position is announced politely so the change is perceivable
                without sight; the visible text carries the same information. */}
            <span
              className="numeric mr-1 text-2xs text-inverse-muted"
              aria-live="polite"
            >
              {index + 1} / {count}
            </span>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Show previous featured drink"
              className="flex h-10 w-10 items-center justify-center rounded-md border border-inverse-line transition-colors hover:bg-inverse-fg/10 focus-visible:outline-inverse-fg"
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
                <path d="M12.5 4L7 10l5.5 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Show next featured drink"
              className="flex h-10 w-10 items-center justify-center rounded-md border border-inverse-line transition-colors hover:bg-inverse-fg/10 focus-visible:outline-inverse-fg"
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
    <div className="relative mt-6 grid gap-5 @3xl:mt-[-2.5rem] @3xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)] @3xl:items-end @3xl:gap-0">
      {/* The photograph, matted in the panel's own cream so the image never
          touches the pine directly — the comp's rule, inverted. */}
      <div className="matte matte-dark @3xl:ml-8">
        <div className="matte-inner">
          <ProductImage
            src={item.image_url}
            alt={item.name}
            sizes="(min-width: 1024px) 380px, (min-width: 640px) 60vw, 90vw"
            priority={isLcp}
            rounded="rounded-none"
            tone="dark"
          />
        </div>
      </div>

      {/* The caption card, straddling the photo's edge once the panel is
          wide enough to carry the overlap. */}
      <div className="relative z-10 rounded-2xl bg-inverse-card p-5 text-inverse-card-fg sm:p-6 @3xl:-ml-16 @3xl:mb-8">
        <p className="eyebrow text-inverse-display">{item.flavor}</p>

        {/* h3: the panel's h2 is the section heading, and this must not skip
            a level */}
        <h3 className="display mt-2 text-3xl">
          <Link
            href={`/menu/${item.id}`}
            className="underline-offset-4 hover:underline focus-visible:outline-inverse-card-fg"
          >
            {item.name}
          </Link>
        </h3>

        <div className="mt-3">
          <RatingSummary average={averageRating} count={ratingCount} tone="dark" />
        </div>

        {item.description && (
          // max-w keeps the measure near 55 characters at every width
          <p className="mt-3 line-clamp-2 max-w-[46ch] text-sm text-inverse-muted">
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

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          {/* Live region: the price is the thing that changes when a size is
              picked, and that change happens away from the control. */}
          <p className="numeric text-2xl font-semibold" aria-live="polite">
            {formatPrice(unitPrice)}
            <span className="sr-only"> for {sizeLabel}</span>
          </p>

          <Button
            variant="inverse"
            size="md"
            disabled={!item.is_available}
            className="flex-1 sm:flex-none"
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

"use client";

import Link from "next/link";
import toast from "react-hot-toast";
import type { MenuItem } from "@/types/database";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/format";
import { DEFAULT_SIZE, getSizeOption, priceForSize } from "@/lib/sizes";
import { RatingSummary } from "@/components/star-rating";
import { ProductImage } from "@/components/ui/product-image";
import { Button } from "@/components/ui/button";
import { FavoriteButton } from "@/components/favorite-button";

/**
 * Grid product card.
 *
 * Two shapes, one component: a horizontal row on phones (thumbnail left, facts
 * right — several products stay visible per screen) and the familiar vertical
 * card from `sm` up, where there is width for a large photo.
 *
 * Content order follows the shopper's scan: image → flavour → name → rating →
 * price → action, with price and action sharing a baseline at the bottom so
 * they land in the same place on every card.
 *
 * The whole card is clickable via a "stretched link" — the title link paints an
 * absolutely-positioned pseudo-element across the card. That leaves exactly one
 * link in the accessibility tree (named by the product) and keeps the Add
 * button a sibling rather than a button nested inside an anchor, which is
 * invalid HTML. Both the Add and the favourite control carry `relative z-10` to
 * sit above that overlay — without it they would be unclickable.
 */
export function MenuItemCard({
  item,
  averageRating = null,
  ratingCount = 0,
  isFavorite = false,
  isLoggedIn = false,
}: {
  item: MenuItem;
  averageRating?: number | null;
  ratingCount?: number;
  isFavorite?: boolean;
  isLoggedIn?: boolean;
}) {
  const { addItem } = useCart();
  const defaultPrice = priceForSize(item.price, DEFAULT_SIZE);
  const defaultSizeLabel = getSizeOption(DEFAULT_SIZE).label;

  return (
    <article className="group relative flex w-full gap-3 overflow-hidden rounded-lg border border-line bg-card p-3 transition-shadow duration-200 ease-hi hover:shadow-md focus-within:shadow-md sm:flex-col sm:gap-0">
      <div className="relative w-28 shrink-0 sm:w-full">
        <ProductImage
          src={item.image_url}
          alt={item.name}
          // 112px thumb on phones; roughly half, a third, then a quarter of the
          // 1152px container as the grid gains columns
          sizes="(min-width: 1280px) 264px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 112px"
          rounded="rounded-md"
        />

        {!item.is_available && (
          <span className="absolute left-2 top-2 rounded-full bg-ink px-2 py-0.5 text-2xs font-semibold uppercase tracking-wider text-surface">
            Sold out
          </span>
        )}

        {/* Sits on the image, opposite corner to the sold-out flag so the two
            never collide. */}
        <div className="absolute right-2 top-2">
          <FavoriteButton
            menuItemId={item.id}
            itemName={item.name}
            isFavorite={isFavorite}
            isLoggedIn={isLoggedIn}
            size="sm"
          />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:pt-3">
        <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-muted">
          {item.flavor}
        </p>

        <h3 className="text-sm font-semibold leading-snug text-ink">
          {/* after:absolute … stretches this link across the whole card */}
          <Link
            href={`/menu/${item.id}`}
            className="decoration-line-strong underline-offset-2 after:absolute after:inset-0 after:content-[''] hover:underline"
          >
            {item.name}
          </Link>
        </h3>

        <RatingSummary average={averageRating} count={ratingCount} />

        <div className="mt-auto flex flex-wrap items-end justify-between gap-2 pt-3">
          <div className="min-w-0">
            <p className="text-base font-semibold tabular-nums text-ink">
              {formatPrice(defaultPrice)}
            </p>
            <p className="text-2xs text-muted">
              {defaultSizeLabel} &middot; from {formatPrice(priceForSize(item.price, "S"))}
            </p>
          </div>

          {/* z-10 lifts the button above the stretched link's overlay */}
          <Button
            size="sm"
            variant={item.is_available ? "primary" : "outline"}
            className="relative z-10 shrink-0"
            disabled={!item.is_available}
            aria-label={
              item.is_available
                ? `Add ${item.name}, ${defaultSizeLabel}, to cart`
                : `${item.name} is sold out`
            }
            onClick={() => {
              addItem({
                menuItemId: item.id,
                name: item.name,
                flavor: item.flavor,
                size: DEFAULT_SIZE,
                price: defaultPrice,
                imageUrl: item.image_url,
              });
              toast.success(`${item.name} (${defaultSizeLabel}) added to cart`);
            }}
          >
            {item.is_available ? "Add" : "Sold out"}
          </Button>
        </div>
      </div>
    </article>
  );
}

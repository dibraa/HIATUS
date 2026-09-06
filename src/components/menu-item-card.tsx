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
 * Grid product card — the comp's "Best products" card.
 *
 * From `sm` up it is the reference's arrangement, centred: a tracked category
 * label, the name in condensed caps, the product on the card's own ground, and
 * a price sitting over a full-width action. The whole card warms to `raised` on
 * hover while the button fills to espresso — in the comp those two happen
 * together, which is what makes a card feel picked up rather than merely
 * pointed at.
 *
 * Below `sm` it stays a horizontal row (thumbnail left, facts right) so several
 * products remain visible per screen. A centred column that tall would show two
 * drinks on a phone.
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
    <article className="group relative flex w-full gap-3 rounded-lg border border-line bg-card p-3 transition-colors duration-(--hi-dur-base) hover:bg-raised focus-within:bg-raised sm:flex-col sm:gap-0 sm:p-5">
      {/* Order is reversed from the DOM on sm+: the label and name sit ABOVE
          the image in the comp, and reordering visually rather than in markup
          would put the product name after its picture for a screen reader. */}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:order-2 sm:items-center sm:gap-2 sm:pt-4 sm:text-center">
        <p className="eyebrow text-muted">{item.flavor}</p>

        <h3 className="display text-lg text-ink sm:text-xl">
          {/* after:absolute … stretches this link across the whole card */}
          <Link
            href={`/menu/${item.id}`}
            className="decoration-line-strong underline-offset-4 after:absolute after:inset-0 after:content-[''] hover:underline"
          >
            {item.name}
          </Link>
        </h3>

        <div className="sm:flex sm:justify-center">
          <RatingSummary average={averageRating} count={ratingCount} />
        </div>

        {/* The comp sets the action and the price on one line. At four columns
            a card is ~200px wide, where a tracked "ADD TO CART" plus a peso
            price wraps into two ragged rows — so from sm the pair stacks and
            centres, and the button takes the full width as a larger tap
            target. On the phone row layout there is width for one line. */}
        <div className="mt-auto flex w-full flex-wrap items-end justify-between gap-2 pt-3 sm:flex-col sm:items-stretch sm:gap-3 sm:pt-5">
          {/* z-10 lifts the button above the stretched link's overlay */}
          <Button
            size="sm"
            variant="outline"
            className="relative z-10 order-2 shrink-0"
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
            {item.is_available ? "Add to cart" : "Sold out"}
          </Button>

          <div className="order-1 min-w-0 text-left sm:text-center">
            <p className="numeric text-base font-semibold text-ink">
              {formatPrice(defaultPrice)}
            </p>
            <p className="eyebrow mt-0.5 text-muted">
              {defaultSizeLabel} &middot; from {formatPrice(priceForSize(item.price, "S"))}
            </p>
          </div>
        </div>
      </div>

      {/* order-first restores the phone layout (thumbnail leading the row);
          from sm it takes its place above the name again. */}
      <div className="relative order-first w-28 shrink-0 sm:order-1 sm:w-full">
        <ProductImage
          src={item.image_url}
          alt={item.name}
          // 112px thumb on phones; roughly half, a third, then a quarter of the
          // 1152px container as the grid gains columns
          sizes="(min-width: 1280px) 264px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 112px"
          rounded="rounded-md sm:rounded-lg"
        />

        {!item.is_available && (
          <span className="ui-caps absolute left-2 top-2 rounded-md bg-cta px-2 py-1 text-2xs text-cta-fg">
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
    </article>
  );
}

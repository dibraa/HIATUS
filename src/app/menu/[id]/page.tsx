import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerToken } from "@/lib/server-token";
import { apiJson } from "@/lib/api-client";
import { formatPrice } from "@/lib/format";
import { priceForSize } from "@/lib/sizes";
import { StarRating, RatingSummary } from "@/components/star-rating";
import { MenuItemCard } from "@/components/menu-item-card";
import { ProductImage } from "@/components/ui/product-image";
import { aggregateRatings } from "@/lib/ratings";
import type { MenuItem, Rating } from "@/types/database";
import { FavoriteButton } from "@/components/favorite-button";
import { getCurrentUser } from "@/lib/auth";
import { AddToCart } from "./add-to-cart";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const raw = await apiJson<(MenuItem & { _id: string }) | null>(`/menu/${id}`).catch(() => null);
  if (!raw) return { title: "Drink not found" };
  return {
    title: raw.name,
    description: raw.description ?? `Order a ${raw.flavor} ${raw.name} ahead from Hiatus Coffee.`,
  };
}

export default async function MenuItemPage({ params }: Params) {
  const { id } = await params;
  const token = await getServerToken();

  const raw = await apiJson<(MenuItem & { _id: string }) | null>(`/menu/${id}`).catch(() => null);
  if (!raw) notFound();
  const item: MenuItem = { ...raw, id: raw._id ?? raw.id };

  const [allRatingsRaw, user] = await Promise.all([
    apiJson<(Rating & { _id: string; menu_item_id: string | { _id: string } })[]>("/menu/ratings/all").catch(() => []),
    getCurrentUser(),
  ]);

  const normaliseId = (mid: string | { _id: string }) =>
    typeof mid === "object" && mid !== null ? mid._id : mid;

  const ratingList = allRatingsRaw
    .filter((r) => normaliseId(r.menu_item_id) === id)
    .map((r) => ({ ...r, id: r._id ?? r.id, menu_item_id: normaliseId(r.menu_item_id) }));

  const favoriteRow = user
    ? await apiJson<{ menu_item_id: string | { _id: string } }[]>("/account/favorites", { token: token ?? undefined })
        .then((favs) => favs.find((f) => normaliseId(f.menu_item_id as string | { _id: string }) === id))
        .catch(() => null)
    : null;

  const isFavorite = Boolean(favoriteRow);
  const averageRating = ratingList.length > 0
    ? ratingList.reduce((sum, r) => sum + r.rating, 0) / ratingList.length
    : null;

  const relatedRaw = await apiJson<(MenuItem & { _id: string })[]>(
    `/menu?flavor=${encodeURIComponent(item.flavor)}&available=true`
  ).catch(() => []);
  const related = relatedRaw
    .filter((m) => (m._id ?? m.id) !== id)
    .slice(0, 4)
    .map((m) => ({ ...m, id: m._id ?? m.id }));

  const relatedStats = aggregateRatings(
    allRatingsRaw.map((r) => ({ ...r, id: r._id ?? r.id, menu_item_id: normaliseId(r.menu_item_id) })) as unknown as Rating[]
  );

  const dateFormatter = new Intl.DateTimeFormat("en-PH", { year: "numeric", month: "short", day: "numeric" });

  return (
    <div className="flex flex-col gap-12">
      <nav aria-label="Breadcrumb" className="-mb-4">
        <ol className="ui-caps flex flex-wrap items-center gap-1.5 text-2xs text-muted">
          <li><Link href="/" className="transition-colors hover:text-ink hover:underline underline-offset-4">Menu</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link href={`/?flavor=${encodeURIComponent(item.flavor)}#menu`} className="transition-colors hover:text-ink hover:underline underline-offset-4">{item.flavor}</Link></li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-ink-soft">{item.name}</li>
        </ol>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="matte lg:sticky lg:top-24 lg:self-start">
          <div className="matte-inner">
            <ProductImage src={item.image_url} alt={item.name} sizes="(min-width: 1024px) 552px, 100vw" priority rounded="rounded-none" />
          </div>
        </div>

        <div className="flex flex-col">
          <p className="eyebrow text-muted">{item.flavor}</p>
          <div className="mt-2 flex items-start justify-between gap-4">
            <h1 className="display text-4xl text-ink">{item.name}</h1>
            <FavoriteButton menuItemId={item.id} itemName={item.name} isFavorite={isFavorite} isLoggedIn={!!user} />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <RatingSummary average={averageRating} count={ratingList.length} />
            {ratingList.length > 0 && (
              <a href="#reviews" className="ui-caps text-2xs text-ink-soft underline underline-offset-4 transition-colors hover:text-ink">Read reviews</a>
            )}
          </div>
          {item.description && <p className="mt-5 max-w-[60ch] text-base text-ink-soft">{item.description}</p>}
          <div className="mt-7"><AddToCart item={item} /></div>
          <p className="numeric mt-4 text-2xs text-muted">
            Sizes: small {formatPrice(priceForSize(item.price, "S"))} &middot; medium {formatPrice(priceForSize(item.price, "M"))} &middot; large {formatPrice(priceForSize(item.price, "L"))}
          </p>
        </div>
      </div>

      <section id="reviews" aria-labelledby="reviews-heading" className="scroll-mt-24">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="reviews-heading" className="display text-2xl text-ink">Reviews</h2>
          {averageRating !== null && <RatingSummary average={averageRating} count={ratingList.length} />}
        </div>
        {ratingList.length === 0 ? (
          <p className="mt-4 rounded-lg border border-dashed border-line-strong bg-card px-6 py-10 text-center text-sm text-muted">
            No reviews yet. Ratings come from customers who have picked this drink up.
          </p>
        ) : (
          <ul className="mt-5 flex flex-col gap-4">
            {ratingList.map((rating) => (
              <li key={rating.id} className="rounded-lg border border-line bg-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <StarRating value={rating.rating} readOnly size="sm" />
                  {(() => {
                    const createdAt = new Date(rating.created_at);
                    const hasValidDate = !Number.isNaN(createdAt.getTime());
                    return hasValidDate ? (
                      <time dateTime={rating.created_at} className="text-xs text-muted">{dateFormatter.format(createdAt)}</time>
                    ) : (
                      <span className="text-xs text-muted">Date unavailable</span>
                    );
                  })()}
                </div>
                {rating.comment && <p className="mt-2 max-w-[70ch] text-sm text-ink-soft">{rating.comment}</p>}
                <p className="mt-2 eyebrow text-muted">Verified purchase</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {related.length > 0 && (
        <section aria-labelledby="related-heading">
          <h2 id="related-heading" className="display text-2xl text-ink">More {item.flavor}</h2>
          <ul className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((relatedItem) => {
              const stat = relatedStats.get(relatedItem.id);
              return (
                <li key={relatedItem.id} className="flex">
                  <MenuItemCard item={relatedItem} averageRating={stat?.average ?? null} ratingCount={stat?.count ?? 0} />
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

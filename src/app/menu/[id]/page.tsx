import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";
import { priceForSize } from "@/lib/sizes";
import { StarRating, RatingSummary } from "@/components/star-rating";
import { MenuItemCard } from "@/components/menu-item-card";
import { ProductImage } from "@/components/ui/product-image";
import { aggregateRatings, type RatingStat } from "@/lib/ratings";
import type { MenuItem, Rating } from "@/types/database";
import { AddToCart } from "./add-to-cart";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: item } = await supabase
    .from("menu_items")
    .select("name, description, flavor")
    .eq("id", id)
    .single<Pick<MenuItem, "name" | "description" | "flavor">>();

  if (!item) return { title: "Drink not found" };

  return {
    title: item.name,
    description:
      item.description ?? `Order a ${item.flavor} ${item.name} ahead from Hiatus Coffee.`,
  };
}

export default async function MenuItemPage({ params }: Params) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: item } = await supabase
    .from("menu_items")
    .select("*")
    .eq("id", id)
    .single<MenuItem>();

  if (!item) notFound();

  const { data: ratings } = await supabase
    .from("ratings")
    .select("*")
    .eq("menu_item_id", id)
    .order("created_at", { ascending: false })
    .returns<Rating[]>();

  const ratingList = ratings ?? [];
  const averageRating =
    ratingList.length > 0
      ? ratingList.reduce((sum, r) => sum + r.rating, 0) / ratingList.length
      : null;

  // Cross-sell from the same flavour family — the most likely second choice
  // for someone who has already shown interest in this one.
  const { data: relatedRaw } = await supabase
    .from("menu_items")
    .select("*")
    .eq("flavor", item.flavor)
    .neq("id", item.id)
    .eq("is_available", true)
    .order("name")
    .limit(4)
    .returns<MenuItem[]>();

  const related = relatedRaw ?? [];

  // Only ask for ratings once we know there is something to rate
  let relatedStats = new Map<string, RatingStat>();
  if (related.length > 0) {
    const { data: relatedRatings } = await supabase
      .from("ratings")
      .select("*")
      .in(
        "menu_item_id",
        related.map((r) => r.id)
      )
      .returns<Rating[]>();
    relatedStats = aggregateRatings(relatedRatings ?? []);
  }

  const dateFormatter = new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="flex flex-col gap-12">
      {/* Breadcrumb: gives the product page a way back that is not the browser
          button, and states where in the menu this drink sits */}
      <nav aria-label="Breadcrumb" className="-mb-4">
        <ol className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
          <li>
            <Link href="/" className="transition-colors duration-150 ease-hi hover:text-ink hover:underline underline-offset-4">
              Menu
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link
              href={`/?flavor=${encodeURIComponent(item.flavor)}#menu`}
              className="transition-colors duration-150 ease-hi hover:text-ink hover:underline underline-offset-4"
            >
              {item.flavor}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="font-medium text-ink-soft">
            {item.name}
          </li>
        </ol>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <ProductImage
            src={item.image_url}
            alt={item.name}
            sizes="(min-width: 1024px) 552px, 100vw"
            priority
            rounded="rounded-xl"
          />
        </div>

        <div className="flex flex-col">
          <p className="text-2xs font-semibold uppercase tracking-[0.16em] text-muted">
            {item.flavor}
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            {item.name}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <RatingSummary average={averageRating} count={ratingList.length} />
            {ratingList.length > 0 && (
              <a
                href="#reviews"
                className="text-xs font-medium text-ink-soft underline underline-offset-4 transition-colors duration-150 ease-hi hover:text-ink"
              >
                Read reviews
              </a>
            )}
          </div>

          {item.description && (
            <p className="mt-5 max-w-[60ch] text-base text-ink-soft">{item.description}</p>
          )}

          <div className="mt-7">
            <AddToCart item={item} />
          </div>

          <p className="mt-4 text-xs text-muted">
            Sizes: small {formatPrice(priceForSize(item.price, "S"))} &middot; medium{" "}
            {formatPrice(priceForSize(item.price, "M"))} &middot; large{" "}
            {formatPrice(priceForSize(item.price, "L"))}
          </p>
        </div>
      </div>

      {/* ================= Reviews ================= */}
      <section id="reviews" aria-labelledby="reviews-heading" className="scroll-mt-24">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="reviews-heading" className="text-2xl font-semibold tracking-tight text-ink">
            Reviews
          </h2>
          {averageRating !== null && (
            <RatingSummary average={averageRating} count={ratingList.length} />
          )}
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
                  <time dateTime={rating.created_at} className="text-xs text-muted">
                    {dateFormatter.format(new Date(rating.created_at))}
                  </time>
                </div>

                {rating.comment && (
                  <p className="mt-2 max-w-[70ch] text-sm text-ink-soft">{rating.comment}</p>
                )}

                {/* Factual: RLS only accepts a rating from someone with a
                    completed order containing this item */}
                <p className="mt-2 text-2xs uppercase tracking-wider text-muted">
                  Verified purchase
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ================= Cross-sell ================= */}
      {related.length > 0 && (
        <section aria-labelledby="related-heading">
          <h2 id="related-heading" className="text-2xl font-semibold tracking-tight text-ink">
            More {item.flavor}
          </h2>

          <ul className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((relatedItem) => {
              const stat = relatedStats.get(relatedItem.id);
              return (
                <li key={relatedItem.id} className="flex">
                  <MenuItemCard
                    item={relatedItem}
                    averageRating={stat?.average ?? null}
                    ratingCount={stat?.count ?? 0}
                  />
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

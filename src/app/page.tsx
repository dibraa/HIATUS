import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { MenuItemCard } from "@/components/menu-item-card";
import { FeaturedCarousel, type FeaturedItem } from "@/components/featured-carousel";
import { FlavorFilter } from "@/components/flavor-filter";
import { SearchField } from "@/components/search-field";
import { ButtonLink } from "@/components/ui/button";
import { aggregateRatings } from "@/lib/ratings";
import type { MenuItem, Rating } from "@/types/database";

/** How many drinks the hero carousel rotates through. */
const FEATURED_COUNT = 5;

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ flavor?: string; q?: string }>;
}) {
  const { flavor, q } = await searchParams;
  const query = q?.trim() ?? "";
  const supabase = await createClient();

  // Two queries, not two-per-card: the whole menu and the whole rating set,
  // rolled up in memory. A shop menu is tens of rows, so filtering client-side
  // below also lets the flavour chips list every flavour even while a search
  // narrows the grid.
  const [{ data: allItems }, { data: allRatings }] = await Promise.all([
    supabase.from("menu_items").select("*").order("name").returns<MenuItem[]>(),
    supabase.from("ratings").select("*").returns<Rating[]>(),
  ]);

  const items = allItems ?? [];
  const ratingStats = aggregateRatings(allRatings ?? []);
  const flavors = Array.from(new Set(items.map((i) => i.flavor))).sort();

  const needle = query.toLowerCase();
  const visibleItems = items.filter((item) => {
    if (flavor && item.flavor !== flavor) return false;
    if (!needle) return true;
    return (
      item.name.toLowerCase().includes(needle) ||
      item.flavor.toLowerCase().includes(needle) ||
      (item.description?.toLowerCase().includes(needle) ?? false)
    );
  });

  // Feature what customers actually rate highly, and only what can be bought.
  // Ties and unrated drinks fall back to alphabetical, which the query already
  // sorted by, so the hero is stable between loads rather than shuffling.
  const featured: FeaturedItem[] = items
    .filter((item) => item.is_available)
    .map((item) => {
      const stat = ratingStats.get(item.id);
      return {
        item,
        averageRating: stat?.average ?? null,
        ratingCount: stat?.count ?? 0,
      };
    })
    .sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0))
    .slice(0, FEATURED_COUNT);

  const isFiltered = Boolean(flavor) || query.length > 0;

  return (
    <div className="flex flex-col gap-10">
      {/* ================= Hero ================= */}
      <section className="relative overflow-hidden rounded-xl border border-line bg-card px-5 py-8 sm:px-8 sm:py-10">
        {/* Soft tonal shape, echoing the reference's circle — decorative only */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-32 h-[26rem] w-[26rem] rounded-full bg-raised"
        />

        <div className="relative grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-12">
          <div>
            <p className="text-2xs font-semibold uppercase tracking-[0.18em] text-muted">
              Pickup only &middot; Cash on pickup
            </p>

            {/* Single h1 per page; the featured card's product name is the h2 */}
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Your coffee, ready
              <br className="hidden sm:block" /> when you are.
            </h1>

            {/* ~55 characters per line — inside the comfortable 50–75 range */}
            <p className="mt-4 max-w-[46ch] text-base text-ink-soft">
              Order ahead from the Hiatus menu and collect it without queueing.
              Pay cash when you pick it up.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <ButtonLink href="#menu" size="lg">
                Browse the menu
              </ButtonLink>
              <ButtonLink href="/orders" variant="secondary" size="lg">
                Track an order
              </ButtonLink>
            </div>

            {/* Trust signals — each states a fact the shop actually honours */}
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted">
              <li className="flex items-center gap-1.5">
                <Check /> No queueing
              </li>
              <li className="flex items-center gap-1.5">
                <Check /> Cancel while pending
              </li>
              <li className="flex items-center gap-1.5">
                <Check /> Rated by real customers
              </li>
            </ul>
          </div>

          <FeaturedCarousel featured={featured} />
        </div>
      </section>

      {/* ================= Menu ================= */}
      <section id="menu" aria-labelledby="menu-heading" className="scroll-mt-20">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 id="menu-heading" className="text-2xl font-semibold tracking-tight text-ink">
              The menu
            </h2>

            <p className="text-sm text-muted">
              {visibleItems.length}{" "}
              {visibleItems.length === 1 ? "drink" : "drinks"}
              {query && (
                <>
                  {" "}
                  matching <span className="font-medium text-ink">&ldquo;{query}&rdquo;</span>
                </>
              )}
            </p>
          </div>

          {/* Header search is hidden below md, so the menu carries its own there */}
          <SearchField query={query} flavor={flavor} className="md:hidden" />

          {/* Stacks below sm: the chip row bleeds past its padding (-mx-4) to sit
              flush with the screen edge, which would slide it under a sibling
              on the same line. */}
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <FlavorFilter flavors={flavors} activeFlavor={flavor} query={query} />

            {isFiltered && (
              <Link
                href="/#menu"
                className="text-xs font-medium text-ink-soft underline underline-offset-4 transition-colors duration-150 ease-hi hover:text-ink"
              >
                Clear filters
              </Link>
            )}
          </div>
        </div>

        <div className="mt-6">
          {items.length === 0 ? (
            <EmptyState
              title="The menu is being set up"
              body="No drinks have been added yet. Check back shortly."
            />
          ) : visibleItems.length === 0 ? (
            <EmptyState
              title="No drinks match that"
              body={
                query
                  ? `Nothing matched “${query}”${flavor ? ` in ${flavor}` : ""}. Try a different word or clear the filters.`
                  : `There is nothing in ${flavor} right now.`
              }
              action={
                <ButtonLink href="/#menu" variant="secondary" size="md">
                  Show all drinks
                </ButtonLink>
              }
            />
          ) : (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visibleItems.map((item) => {
                const stat = ratingStats.get(item.id);
                return (
                  <li key={item.id} className="flex">
                    <MenuItemCard
                      item={item}
                      averageRating={stat?.average ?? null}
                      ratingCount={stat?.count ?? 0}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function Check() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-ink" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M3 8.5l3.5 3.5L13 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Shared empty state: says what happened and offers the way out. */
function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashed border-line-strong bg-card px-6 py-14 text-center">
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      <p className="mx-auto mt-2 max-w-[44ch] text-sm text-muted">{body}</p>
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}

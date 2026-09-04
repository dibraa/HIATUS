import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { MenuItemCard } from "@/components/menu-item-card";
import { FeaturedCarousel, type FeaturedItem } from "@/components/featured-carousel";
import { MenuFilters } from "@/components/menu-filters";
import { SearchField } from "@/components/search-field";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { CheckerBand } from "@/components/ui/checker";
import { Badge } from "@/components/ui/badge";
import { aggregateRatings } from "@/lib/ratings";
import { getSettings, isOpenNow } from "@/lib/settings";
import type { MenuItem, Rating } from "@/types/database";

/** How many drinks the hero carousel rotates through. */
const FEATURED_COUNT = 5;

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ flavor?: string; category?: string; q?: string }>;
}) {
  const { flavor, category, q } = await searchParams;
  const query = q?.trim() ?? "";
  const supabase = await createClient();

  // Two queries, not two-per-card: the whole menu and the whole rating set,
  // rolled up in memory. A shop menu is tens of rows, so filtering client-side
  // below also lets the chips list every value even while a search narrows the
  // grid.
  const [{ data: allItems }, { data: allRatings }, user, settings] = await Promise.all([
    supabase.from("menu_items").select("*").order("name").returns<MenuItem[]>(),
    supabase.from("ratings").select("*").returns<Rating[]>(),
    getCurrentUser(),
    getSettings(),
  ]);

  // Only asked for once we know there is someone to ask about.
  const { data: favoriteRows } = user
    ? await supabase.from("favorites").select("menu_item_id").eq("user_id", user.id)
    : { data: null };

  const favoriteIds = new Set(
    (favoriteRows ?? []).map((f) => f.menu_item_id as string)
  );

  const items = allItems ?? [];
  const ratingStats = aggregateRatings(allRatings ?? []);
  const { open, today } = isOpenNow(settings.businessHours);

  const categories = Array.from(
    new Set(items.map((i) => i.category).filter(Boolean))
  ).sort();

  // Flavours are listed for the CHOSEN category, so the chip row never offers
  // a combination that returns nothing.
  const flavors = Array.from(
    new Set(
      items
        .filter((i) => !category || i.category === category)
        .map((i) => i.flavor)
    )
  ).sort();

  const needle = query.toLowerCase();
  const visibleItems = items.filter((item) => {
    if (category && item.category !== category) return false;
    if (flavor && item.flavor !== flavor) return false;
    if (!needle) return true;
    return (
      item.name.toLowerCase().includes(needle) ||
      item.flavor.toLowerCase().includes(needle) ||
      item.category.toLowerCase().includes(needle) ||
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

  const isFiltered = Boolean(flavor) || Boolean(category) || query.length > 0;

  return (
    <div className="flex flex-col gap-12">
      {/* ================= Hero ================= */}
      <section className="relative overflow-hidden rounded-xl border border-line bg-card">
        <CheckerBand size="sm" className="h-2" />

        <div className="px-5 py-8 sm:px-8 sm:py-10">
          <div className="relative grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-12">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={open ? "success" : "neutral"}>
                  {open ? "Open now" : "Closed"}
                </Badge>
                {today && !today.closed && (
                  <span className="text-2xs font-semibold uppercase tracking-[0.16em] text-muted">
                    {today.label} {today.open}–{today.close}
                  </span>
                )}
              </div>

              {/* Single h1 per page; the featured card's product name is the h2 */}
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                Slow moments,
                <br className="hidden sm:block" /> served warm.
              </h1>

              {/* ~55 characters per line — inside the comfortable 50–75 range */}
              <p className="mt-4 max-w-[46ch] text-base text-ink-soft">
                Order ahead from the Hiatus menu, pick a size, and collect it
                without queueing. Dine in or take it with you.
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
              {visibleItems.length} {visibleItems.length === 1 ? "item" : "items"}
              {query && (
                <>
                  {" "}
                  matching{" "}
                  <span className="font-medium text-ink">&ldquo;{query}&rdquo;</span>
                </>
              )}
            </p>
          </div>

          {/* Header search is hidden below md, so the menu carries its own there */}
          <SearchField query={query} flavor={flavor} className="md:hidden" />

          <MenuFilters
            categories={categories}
            flavors={flavors}
            state={{ category, flavor, query }}
          />

          {isFiltered && (
            <Link
              href="/#menu"
              className="self-start text-xs font-medium text-accent-ink underline underline-offset-4 transition-colors duration-150 ease-hi hover:text-ink"
            >
              Clear filters
            </Link>
          )}
        </div>

        <div className="mt-6">
          {items.length === 0 ? (
            <EmptyState
              as="h3"
              title="The menu is being set up"
              body="Nothing has been added yet. Check back shortly."
            />
          ) : visibleItems.length === 0 ? (
            <EmptyState
              as="h3"
              title="Nothing matches that"
              body={
                query
                  ? `Nothing matched “${query}”. Try a different word or clear the filters.`
                  : "There is nothing in this part of the menu right now."
              }
              action={
                <ButtonLink href="/#menu" variant="outline" size="md">
                  Show everything
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
                      isFavorite={favoriteIds.has(item.id)}
                      isLoggedIn={!!user}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <CheckerBand size="sm" className="h-1.5 opacity-70" />

      {/* ================= Why choose us ================= */}
      <section aria-labelledby="why-heading">
        <h2
          id="why-heading"
          className="text-2xl font-semibold tracking-tight text-ink"
        >
          Why order with us
        </h2>
        <p className="mt-2 max-w-[58ch] text-base text-ink-soft">
          Three things we hold ourselves to, and you can hold us to as well.
        </p>

        <ul className="mt-7 grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: <ClockIcon />,
              title: "No queueing",
              body: "Order from wherever you are and collect when it is ready. Your order page shows the live status and a real wait estimate.",
            },
            {
              icon: <BeanIcon />,
              title: "Made to order",
              body: "Nothing sits under a lamp. Every drink is made when the ticket reaches the counter, at the size you chose.",
            },
            {
              icon: <StarIcon />,
              title: "Rated by customers",
              body: "Every rating on this menu comes from someone who actually bought and collected that drink. There is no other way to leave one.",
            },
          ].map((feature) => (
            <li
              key={feature.title}
              className="rounded-lg border border-line bg-card p-5"
            >
              <span
                aria-hidden="true"
                className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-soft text-accent-ink"
              >
                {feature.icon}
              </span>
              <h3 className="mt-4 text-xl font-semibold text-ink">{feature.title}</h3>
              <p className="mt-2 text-sm text-ink-soft">{feature.body}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* ================= Our story ================= */}
      <section
        aria-labelledby="story-heading"
        className="overflow-hidden rounded-xl bg-inverse-bg text-inverse-fg"
      >
        <CheckerBand tone="inverse" size="sm" className="h-2" />

        <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-center lg:gap-12">
          <div>
            <p className="text-2xs font-semibold uppercase tracking-[0.18em] text-inverse-muted">
              Our story
            </p>

            <h2
              id="story-heading"
              className="mt-3 text-2xl font-semibold tracking-tight text-inverse-fg sm:text-3xl"
            >
              A pause worth taking.
            </h2>

            <div className="mt-5 flex flex-col gap-4 text-base text-inverse-muted">
              <p className="max-w-[54ch]">
                Hiatus started with a small complaint: the best part of a coffee
                is the few minutes you spend with it, and the worst part is the
                ten you spend queueing first.
              </p>
              <p className="max-w-[54ch]">
                So we built the shop around the pause rather than the line.
                Order ahead, arrive when it is ready, and spend the time you
                would have spent waiting doing something better — even if that
                something is nothing at all.
              </p>
            </div>

            <div className="mt-7">
              {/* `inverse` variant, not `primary`: burnt orange on forest green
                  is 2.59:1 and would be barely visible here. */}
              <ButtonLink href="#menu" variant="inverse" size="lg">
                Start an order
              </ButtonLink>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-4">
            {[
              { label: "On the menu", value: String(items.length) },
              {
                label: "Ratings left",
                value: String((allRatings ?? []).length),
              },
              { label: "Sizes", value: "3" },
              { label: "Queueing", value: "None" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-lg border border-inverse-line p-4"
              >
                <dt className="text-2xs font-semibold uppercase tracking-[0.14em] text-inverse-muted">
                  {stat.label}
                </dt>
                <dd className="mt-1.5 text-2xl font-semibold tabular-nums text-inverse-fg">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ================= Hours ================= */}
      <section aria-labelledby="hours-heading">
        <h2 id="hours-heading" className="text-2xl font-semibold tracking-tight text-ink">
          When we are open
        </h2>

        <ul className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {settings.businessHours.map((day) => {
            const isToday = today?.day === day.day;

            return (
              <li
                key={day.day}
                className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 ${
                  isToday ? "border-accent bg-accent-soft" : "border-line bg-card"
                }`}
              >
                <span
                  className={`text-sm ${
                    isToday ? "font-semibold text-ink" : "text-ink-soft"
                  }`}
                >
                  {day.label}
                  {isToday && <span className="sr-only"> (today)</span>}
                </span>
                <span
                  className={`shrink-0 text-sm tabular-nums ${
                    day.closed ? "text-muted" : "text-ink-soft"
                  }`}
                >
                  {day.closed ? "Closed" : `${day.open}–${day.close}`}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function Check() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-accent-ink" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M3 8.5l3.5 3.5L13 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BeanIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M4 8h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8z" strokeLinejoin="round" />
      <path d="M17 9h1.5a2.5 2.5 0 0 1 0 5H17" strokeLinecap="round" />
      <path d="M8 2.5c0 1-1 1.5-1 2.5M12 2.5c0 1-1 1.5-1 2.5" strokeLinecap="round" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path
        d="M12 3.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8-4.2-4.1 5.9-.9z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

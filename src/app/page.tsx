import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { MenuItemCard } from "@/components/menu-item-card";
import { FeaturedCarousel, type FeaturedItem } from "@/components/featured-carousel";
import { MenuFilters } from "@/components/menu-filters";
import { SearchField } from "@/components/search-field";
import { Wordmark } from "@/components/brand";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import {
  BeanDoodle,
  BeansGlyph,
  CroissantDoodle,
  CupGlyph,
  CupcakeDoodle,
  FilterGlyph,
  PotGlyph,
} from "@/components/ui/doodles";
import { aggregateRatings } from "@/lib/ratings";
import { getSettings, isOpenNow } from "@/lib/settings";
import { formatPrice } from "@/lib/format";
import { priceForSize } from "@/lib/sizes";
import type { MenuItem, Rating } from "@/types/database";

/** How many drinks the featured panel rotates through. */
const FEATURED_COUNT = 5;

/** The glyphs the hero's category tiles cycle through, in order. */
const CATEGORY_GLYPHS = [CupGlyph, BeansGlyph, FilterGlyph, PotGlyph];

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
  // sorted by, so the panel is stable between loads rather than shuffling.
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

  const heroItem = featured[0]?.item ?? items[0] ?? null;
  const isFiltered = Boolean(flavor) || Boolean(category) || query.length > 0;

  return (
    <div className="flex flex-col gap-section">
      {/* ======================================================= Hero ======
          Eyebrow, one enormous line, then the matted photograph with things
          laid over it — the comp's opening, beat for beat. */}
      <section>
        <p className="eyebrow rise text-center text-muted">
          Redefining rituals, one sip at a time
        </p>

        {/* One class, not `text-5xl sm:text-6xl lg:text-7xl`: the size is fluid
            now, so it reads 48px on a phone and 96px at 1280 with nothing
            flat in between. */}
        <h1 className="display rise mt-block text-center text-7xl text-ink [--rise:1]">
          Elevate your everyday brew
        </h1>

        {/* The photograph is the LCP element and is deliberately NOT part of
            the entrance — see the `.rise` note in globals.css. */}
        <div className="relative mt-heading">
          <div className="matte">
            <div className="matte-inner relative aspect-[16/10] bg-raised sm:aspect-[16/8]">
              {heroItem?.image_url ? (
                <Image
                  src={heroItem.image_url}
                  alt={heroItem.name}
                  fill
                  // The hero is the LCP element: it must not lazy-load, and the
                  // sizes hint has to describe the full-width container or the
                  // browser downloads a thumbnail and upscales it.
                  priority
                  sizes="(min-width: 1152px) 1128px, 100vw"
                  className="object-cover"
                />
              ) : (
                <div
                  aria-hidden="true"
                  className="flex h-full w-full items-center justify-center"
                >
                  <BeanDoodle className="doodle h-32 w-32" />
                </div>
              )}
            </div>
          </div>

          {/* Category tiles, laid over the photograph's top-right corner.
              Hidden below sm, where they would cover most of the image. */}
          {categories.length > 0 && (
            <nav
              aria-label="Browse by category"
              className="absolute right-5 top-5 hidden rounded-xl bg-card p-1.5 sm:flex sm:gap-1.5"
            >
              {categories.slice(0, 4).map((name, i) => {
                const Glyph = CATEGORY_GLYPHS[i % CATEGORY_GLYPHS.length];
                return (
                  <Link
                    key={name}
                    href={`/?category=${encodeURIComponent(name)}#menu`}
                    title={name}
                    className="flex h-11 w-11 items-center justify-center rounded-lg bg-cta text-cta-fg transition-colors hover:bg-cta-hover"
                  >
                    <Glyph className="h-5 w-5" />
                    <span className="sr-only">{name}</span>
                  </Link>
                );
              })}
            </nav>
          )}

          {/* The mark, hanging off the photograph's bottom-left corner. */}
          <div
            aria-hidden="true"
            className="absolute bottom-5 left-5 hidden rounded-xl bg-inverse-bg px-5 py-3 text-inverse-fg sm:block"
          >
            <Wordmark size="sm" />
          </div>
        </div>

        {/* The two facts a shopper needs before they start: whether the shop is
            open, and where the menu is. */}
        <div className="rise mt-block flex flex-wrap items-center justify-between gap-x-6 gap-y-4 [--rise:2]">
          <div className="flex flex-wrap items-center gap-3">
            <Badge tone={open ? "success" : "neutral"}>
              {open ? "Open now" : "Closed"}
            </Badge>
            {today && !today.closed && (
              <span className="ui-caps text-2xs text-muted">
                {today.label} {today.open}–{today.close}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <ButtonLink href="#menu" size="lg">
              Browse the menu
            </ButtonLink>
            <ButtonLink href="/orders" variant="outline" size="lg">
              Track an order
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* ================================================ Facts strip ======
          Where the comp runs a row of partner logos. We have no partners to
          borrow credibility from, so the strip carries the four operational
          promises the shop actually keeps — the same reassurance, honestly
          sourced. */}
      <section aria-label="How ordering works" className="full-bleed">
        <div className="mx-auto max-w-6xl px-4">
          <ul className="grid gap-y-6 rounded-2xl bg-card px-6 py-7 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-6">
            {[
              "Pickup only",
              "Cash on pickup",
              "Made to order",
              "Rated by customers",
            ].map((fact) => (
              <li
                key={fact}
                className="ui-caps text-center text-xs text-ink-soft lg:text-sm"
              >
                {fact}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ======================================================= Menu ======
          The comp's "Best products": a centred display heading over a grid of
          cards. Search and the filter chips sit with it, because they filter
          this grid and nothing else. */}
      <section id="menu" aria-labelledby="menu-heading" className="scroll-mt-20">
        <h2 id="menu-heading" className="display text-center text-5xl text-ink">
          The menu
        </h2>

        <p className="mt-snug text-center text-sm text-muted">
          {visibleItems.length} {visibleItems.length === 1 ? "drink" : "drinks"}
          {query && (
            <>
              {" "}
              matching <span className="font-semibold text-ink">&ldquo;{query}&rdquo;</span>
            </>
          )}
        </p>

        <div className="mx-auto mt-heading flex max-w-2xl flex-col gap-4">
          <SearchField query={query} flavor={flavor} />
        </div>

        <div className="mt-block flex flex-col gap-3">
          <MenuFilters
            categories={categories}
            flavors={flavors}
            state={{ category, flavor, query }}
          />

          {isFiltered && (
            <Link
              href="/#menu"
              className="ui-caps self-start text-2xs text-accent-ink underline underline-offset-4 transition-colors hover:text-ink"
            >
              Clear filters
            </Link>
          )}
        </div>

        <div className="mt-block">
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

      {/* ================================================ Pair strip ======
          The comp's four-across photo run. Four highest-rated drinks, cropped
          tall, captioned only with a name and a price — appetite first, detail
          on the product page. */}
      {featured.length >= 4 && (
        <section aria-labelledby="pair-heading">
          <h2 id="pair-heading" className="display text-5xl text-ink">
            Brew. Pair. Enjoy.
          </h2>

          <ul className="mt-heading grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {featured.slice(0, 4).map(({ item }) => (
              <li key={item.id}>
                <Link
                  href={`/menu/${item.id}`}
                  className="group block rounded-xl focus-visible:outline-offset-4"
                >
                  <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-raised">
                    {item.image_url ? (
                      <Image
                        src={item.image_url}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 264px, 45vw"
                        className="object-cover transition-transform duration-(--hi-dur-slow) ease-hi-out group-hover:scale-[1.04]"
                      />
                    ) : (
                      <div
                        aria-hidden="true"
                        className="flex h-full w-full items-center justify-center"
                      >
                        <BeanDoodle className="doodle h-14 w-14" />
                      </div>
                    )}
                  </div>

                  <p className="display mt-snug text-lg text-ink group-hover:underline">
                    {item.name}
                  </p>
                  <p className="numeric mt-0.5 text-xs text-muted">
                    from {formatPrice(priceForSize(item.price, "S"))}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* =============================================== Featured panel ==== */}
      <FeaturedCarousel featured={featured} />

      {/* ================================================ Loyalty band =====
          The comp's tan break, with the drawings in the margins. Full-bleed:
          a section that changes the page's ground has to reach the edges or it
          reads as a card that happens to be beige. */}
      <section aria-labelledby="loyalty-heading" className="full-bleed bg-band py-band">
        <div className="relative mx-auto max-w-4xl px-4 text-center">
          <CupcakeDoodle
            className="doodle pointer-events-none absolute -left-4 top-2 hidden h-28 w-28 text-band-fg lg:block"
          />
          <CroissantDoodle
            className="doodle pointer-events-none absolute -right-4 bottom-0 hidden h-28 w-28 text-band-fg lg:block"
          />

          <h2 id="loyalty-heading" className="text-band-fg">
            <span className="display-soft block text-5xl">
              Buy 10 drinks,
            </span>
            <span className="display mt-1 block text-5xl">Get 1 free</span>
          </h2>

          <p className="ui-caps mx-auto mt-block max-w-[52ch] text-2xs text-band-muted sm:text-xs">
            Every handcrafted drink earns you a bean. Collect ten and your next
            one is free — because loyalty should taste like reward.
          </p>

          <div className="mt-heading flex justify-center">
            <ButtonLink href={user ? "/#menu" : "/signup"} size="lg">
              {user ? "Start an order" : "Join the club"}
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* ================================================== Promises ======
          The three claims the facts strip makes in two words each, with the
          reasoning behind them. Kept as prose in the body face: this is the one
          part of the page someone reads rather than scans. */}
      <section aria-labelledby="why-heading">
        <h2 id="why-heading" className="display text-5xl text-ink">
          Why order with us
        </h2>

        <ul className="mt-heading grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: <ClockIcon />,
              title: "No queueing",
              body: "Order from wherever you are and collect when it is ready. Your order page shows the live status and a real wait estimate.",
            },
            {
              icon: <BeansGlyph className="h-6 w-6" />,
              title: "Made to order",
              body: "Nothing sits under a lamp. Every drink is made when the ticket reaches the counter, at the size you chose.",
            },
            {
              icon: <StarIcon />,
              title: "Rated by customers",
              body: "Every rating on this menu comes from someone who actually bought and collected that drink. There is no other way to leave one.",
            },
          ].map((feature) => (
            <li key={feature.title} className="rounded-lg border border-line bg-card p-6">
              <span
                aria-hidden="true"
                className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent-soft text-accent-ink"
              >
                {feature.icon}
              </span>
              <h3 className="display mt-block text-xl text-ink">{feature.title}</h3>
              <p className="mt-tight text-sm text-ink-soft">{feature.body}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* ====================================================== Story ====== */}
      <section aria-labelledby="story-heading">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-center lg:gap-16">
          <div>
            <p className="eyebrow text-muted">Our story</p>

            <h2
              id="story-heading"
              className="display mt-block max-w-[14ch] text-5xl text-ink"
            >
              A pause worth taking
            </h2>

            <div className="mt-heading flex flex-col gap-block text-base text-ink-soft">
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
          </div>

          <dl className="grid grid-cols-2 gap-3 sm:gap-4">
            {[
              { label: "On the menu", value: String(items.length) },
              { label: "Ratings left", value: String((allRatings ?? []).length) },
              { label: "Sizes", value: "3" },
              { label: "Queueing", value: "None" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-lg border border-line bg-card p-5">
                <dt className="eyebrow text-muted">{stat.label}</dt>
                <dd className="numeric mt-tight text-2xl font-semibold text-ink">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ====================================================== Hours ====== */}
      <section aria-labelledby="hours-heading">
        <h2 id="hours-heading" className="display text-5xl text-ink">
          When we are open
        </h2>

        <ul className="mt-heading grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {settings.businessHours.map((day) => {
            const isToday = today?.day === day.day;

            return (
              <li
                key={day.day}
                className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3.5 ${
                  isToday ? "border-accent bg-accent-soft" : "border-line bg-card"
                }`}
              >
                <span
                  className={`ui-caps text-2xs ${
                    isToday ? "text-ink" : "text-ink-soft"
                  }`}
                >
                  {day.label}
                  {isToday && <span className="sr-only"> (today)</span>}
                </span>
                <span
                  className={`numeric shrink-0 text-2xs ${
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

/* Two glyphs the doodle set does not cover — same stroke weight and cap style
   as everything in `ui/doodles`, kept local because nothing else needs them. */

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path
        d="M12 3.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8-4.2-4.1 5.9-.9z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

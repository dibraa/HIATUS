import Link from "next/link";
import Image from "next/image";
import { getServerToken } from "@/lib/server-token";
import { apiJson } from "@/lib/api-client";
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

/**
 * The menu grid's class list, keyed by how many drinks are actually showing.
 *
 * A four-column grid builds four columns whether or not there are four cards,
 * so a short menu leaves its cards in column one with the rest of the row
 * empty — under a centred heading that reads as broken rather than as a small
 * menu. Below four, the grid is capped to the width that many cards really
 * occupy and centred with `mx-auto`, so the row stays centred and the cards
 * keep their normal size.
 *
 * The widths are `n * 268px + (n - 1) * 16px` — the measured card width and
 * the `gap-4` between them, so the cap lands exactly on the cards' own edges
 * and never resizes them.
 *
 * Index 4 is the full responsive ladder and is what every menu of four or more
 * renders, identical to before this cap existed. Each entry is a complete
 * literal string because Tailwind compiles by scanning source text: a class
 * assembled at runtime (`sm:grid-cols-${n}`) is never generated and silently
 * does nothing.
 */
// DEPENDENCY: these widths are n * 268px + (n - 1) * 16px — the measured
// card width and the gap-4 between them. If the card width or gap changes,
// these max-w values must be updated in lockstep or the grid will silently
// cap at the wrong width.
const MENU_GRID_COLUMNS = [
  "grid-cols-1", // unused: zero items renders an EmptyState instead
  "grid-cols-1 max-w-[268px]",
  "grid-cols-1 sm:grid-cols-2 max-w-[552px]",
  "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-[836px]",
  "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
] as const;

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ flavor?: string; category?: string; q?: string }>;
}) {
  const { flavor, category, q } = await searchParams;
  const query = q?.trim() ?? "";
  const token = await getServerToken();

  const [allItemsRaw, allRatingsRaw, user, settings] = await Promise.all([
    // `null`, not `[]`, on failure: an unreachable API and an empty menu need
    // different messages, and an empty array cannot tell them apart.
    apiJson<(MenuItem & { _id: string })[]>("/menu").catch(() => null),
    apiJson<(Rating & { _id: string })[]>("/menu/ratings/all").catch(() => null),
    getCurrentUser(),
    getSettings(),
  ]);

  const menuFailed = allItemsRaw === null;
  const allItems = (allItemsRaw ?? []).map((m) => ({ ...m, id: m._id ?? m.id }));
  const allRatings = (allRatingsRaw ?? []).map((r) => ({ ...r, id: r._id ?? r.id, menu_item_id: (r.menu_item_id as unknown as { _id?: string } | string) }));

  const favoriteRows = user
    ? await apiJson<{ menu_item_id: string }[]>("/account/favorites", { token: token ?? undefined }).catch(() => [])
    : [];

  const favoriteIds = new Set(favoriteRows.map((f) => {
    const mid = f.menu_item_id as unknown;
    return typeof mid === "object" && mid !== null ? (mid as { _id: string })._id : mid as string;
  }));

  const items = allItems;
  const ratingStats = aggregateRatings(allRatings as unknown as Rating[]);
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

  // Guests get an introduction to the shop, not the shop itself: the menu,
  // prices and ordering all sit behind sign-in (see AUTH_REQUIRED_PREFIXES).
  // What they do see of the drinks is a photo teaser — names and pictures,
  // nothing they could act on.
  const isGuest = !user;
  const teaser = featured.slice(0, 4).map(({ item }) => item);

  return (
    <div className="flex flex-col gap-section">
      {/* ======================================================= Hero ======
          Eyebrow, one enormous line, then the matted photograph with things
          laid over it — the comp's opening, beat for beat. */}
      <section>
        {/* No label above the headline. A kicker only tells the reader that a
            heading is coming, which they can already see; the line below is
            strong enough to open the page unaccompanied. The old eyebrow copy
            now sits under it, where it reads as a promise rather than a tag. */}

        {/* One class, not `text-5xl sm:text-6xl lg:text-7xl`: the size is fluid
            now, so it reads 48px on a phone and 96px at 1280 with nothing
            flat in between. */}
        <h1 className="display rise text-center text-7xl text-ink [--rise:1]">
          Elevate your everyday brew
        </h1>

        <p className="rise mx-auto mt-stack max-w-[38ch] text-center text-lg text-ink-soft [--rise:2]">
          Redefining rituals, one sip at a time.
        </p>

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
                  unoptimized={heroItem.image_url.includes("/uploads/")}
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

        </div>

        {/* Category tiles — visible on all viewports. On desktop they sit
            below the photo as a horizontal row; on mobile they scroll. */}
        {!isGuest && categories.length > 0 && (
          <nav
            aria-label="Browse by category"
            className="no-scrollbar rise mt-4 flex gap-2 overflow-x-auto [--rise:3]"
          >
            {categories.slice(0, 4).map((name, i) => {
              const Glyph = CATEGORY_GLYPHS[i % CATEGORY_GLYPHS.length];
              return (
                <Link
                  key={name}
                  href={`/?category=${encodeURIComponent(name)}#menu`}
                  className="ui-caps flex shrink-0 items-center gap-2 rounded-md border border-line-strong bg-card px-3 py-2.5 text-2xs text-ink-soft transition-colors hover:border-ink hover:text-ink"
                >
                  <Glyph className="h-4 w-4" />
                  {name}
                </Link>
              );
            })}
          </nav>
        )}

        {/* The two facts a shopper needs before they start: whether the shop is
            open, and where the menu is. */}
        <div className="rise mt-stack flex flex-wrap items-center justify-between gap-x-6 gap-y-4 [--rise:4]">
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

          <div className="flex flex-wrap items-center gap-4">
            {isGuest ? (
              <>
                <ButtonLink href="/signup" size="lg">
                  Sign up to order
                </ButtonLink>
                <ButtonLink href="/login" variant="outline" size="lg">
                  Log in
                </ButtonLink>
              </>
            ) : (
              <>
                <ButtonLink href="#menu" size="lg">
                  Browse the menu
                </ButtonLink>
                <Link
                  href="/orders"
                  className="ui-caps text-2xs text-ink-soft underline-offset-4 transition-colors hover:text-ink hover:underline"
                >
                  Track an order
                </Link>
              </>
            )}
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

      {/* ====================================== Power-user: favorites ======
          For logged-in returning customers, surface their favorites above the
          full menu so a repeat order is one click away. */}
      {user && favoriteIds.size > 0 && (
        <section aria-labelledby="favorites-heading" className="mt-heading">
          <h2 id="favorites-heading" className="display text-2xl text-ink">
            Your favorites
          </h2>
          <ul className="mt-stack grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items
              .filter((item) => favoriteIds.has(item.id))
              .slice(0, 3)
              .map((item) => {
                const stat = ratingStats.get(item.id);
                return (
                  <li key={item.id} className="flex">
                    <MenuItemCard
                      item={item}
                      averageRating={stat?.average ?? null}
                      ratingCount={stat?.count ?? 0}
                      isFavorite={true}
                      isLoggedIn={true}
                    />
                  </li>
                );
              })}
          </ul>
        </section>
      )}

      {isGuest ? (
        /* ================================================ Guest teaser ====
           What a guest sees in place of the menu: the four best-rated drinks
           as photographs and names. No prices, no ratings, no product pages —
           every tile leads to sign-up, which is the only next step a guest
           has. Skipped entirely while the menu is empty rather than showing
           four placeholder doodles. */
        teaser.length > 0 && (
          <section aria-labelledby="teaser-heading">
            <h2 id="teaser-heading" className="display text-5xl text-ink">
              A taste of what we make
            </h2>

            <ul className="mt-heading grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {teaser.map((item) => (
                <li key={item.id}>
                  <Link
                    href="/signup"
                    className="group block rounded-xl focus-visible:outline-offset-4"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-raised">
                      {item.image_url ? (
                        <Image
                          src={item.image_url}
                          alt=""
                          fill
                          unoptimized={item.image_url.includes("/uploads/")}
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
                  </Link>
                </li>
              ))}
            </ul>

            <p className="mt-stack">
              <Link
                href="/signup"
                className="ui-caps text-2xs text-accent-ink underline underline-offset-4 transition-colors hover:text-ink"
              >
                Sign up to see the full menu
              </Link>
            </p>
          </section>
        )
      ) : (
      <>
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

        <div className="mt-stack flex flex-col gap-3">
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

        <div className="mt-stack">
          {menuFailed ? (
            <EmptyState
              as="h3"
              title="We couldn't load the menu"
              body="Something went wrong on our end. Try refreshing the page."
              action={
                <ButtonLink href="/#menu" variant="outline" size="md">
                  Try again
                </ButtonLink>
              }
            />
          ) : items.length === 0 ? (
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
            <ul
              className={`mx-auto grid gap-4 ${
                MENU_GRID_COLUMNS[Math.min(visibleItems.length, 4)]
              }`}
            >
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

      {/* =============================================== Featured panel ==== */}
      <FeaturedCarousel featured={featured} />
      </>
      )}

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

          <p className="ui-caps mx-auto mt-stack max-w-[52ch] text-2xs text-band-muted sm:text-xs">
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
          part of the page someone reads rather than scans.

          Set as a ruled definition list rather than three cards. Three cards of
          icon-heading-paragraph give every claim the same weight and the same
          silhouette, which is how a page ends up looking assembled; hairlines
          and a wide display term let the claim lead and the prose answer it,
          and cost three containers the page did not need. */}
      <section aria-labelledby="why-heading">
        <h2 id="why-heading" className="display text-5xl text-ink">
          Why order with us
        </h2>

        <dl className="mt-heading border-t border-line">
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
            <div
              key={feature.title}
              className="grid gap-x-12 gap-y-3 border-b border-line py-7 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:py-9"
            >
              <dt className="display flex items-center gap-3 text-2xl text-ink lg:text-3xl">
                <span aria-hidden="true" className="shrink-0 text-accent-ink">
                  {feature.icon}
                </span>
                {feature.title}
              </dt>
              <dd className="max-w-[62ch] text-base text-ink-soft">
                {feature.body}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ====================================================== Story ======
          The page's second peak, and the only place the pine panel appears
          above the footer. `inverse` is defined as a SUBJECT rather than a
          ground, and this is the section that earns it: it is the one moment
          that is about the shop rather than about ordering from it, so it
          changes ground to say so.

          Sage (--hi-inverse-display) is display-only at 3.11:1 — AA large.
          The prose beside it uses --hi-inverse-fg at 5.10:1, which is why the
          two are separate tokens. */}
      <section
        id="story"
        aria-labelledby="story-heading"
        className="full-bleed scroll-mt-16 bg-inverse-bg py-band text-inverse-fg"
      >
        <div className="mx-auto grid max-w-6xl gap-y-heading gap-x-16 px-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start">
          <h2
            id="story-heading"
            className="display max-w-[12ch] text-6xl text-inverse-display"
          >
            A pause worth taking
          </h2>

          <div className="flex flex-col gap-stack text-lg leading-relaxed">
            <p className="max-w-[54ch]">
              Hiatus started with a small complaint: the best part of a coffee
              is the few minutes you spend with it, and the worst part is the
              ten you spend queueing first.
            </p>
            <p className="max-w-[54ch] text-inverse-muted">
              So we built the shop around the pause rather than the line.
              Order ahead, arrive when it is ready, and spend the time you
              would have spent waiting doing something better — even if that
              something is nothing at all.
            </p>
          </div>
        </div>
      </section>

      {/* ====================================================== Hours ======
          A ruled timetable, not seven bordered tiles. Seven cards of two words
          each is the card habit doing a table's job: the rows are the same kind
          of fact repeated, which is exactly what hairlines are for. Today is
          marked in accent ink and carries a dot, so the highlight survives
          without colour (WCAG 1.4.1). */}
      <section id="hours" aria-labelledby="hours-heading" className="scroll-mt-20">
        <h2 id="hours-heading" className="display text-5xl text-ink">
          When we are open
        </h2>

        <ul className="mt-heading grid border-t border-line sm:grid-cols-2 sm:gap-x-12">
          {settings.businessHours.map((day) => {
            const isToday = today?.day === day.day;

            return (
              <li
                key={day.day}
                className="flex items-baseline justify-between gap-4 border-b border-line py-4"
              >
                <span
                  className={`ui-caps flex items-center gap-2 text-2xs ${
                    isToday ? "text-accent-ink" : "text-ink-soft"
                  }`}
                >
                  {isToday && (
                    <span
                      aria-hidden="true"
                      className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                    />
                  )}
                  {day.label}
                  {isToday && <span className="sr-only"> (today)</span>}
                </span>
                <span
                  className={`numeric shrink-0 text-2xs ${
                    day.closed
                      ? "text-muted"
                      : isToday
                        ? "text-accent-ink"
                        : "text-ink-soft"
                  }`}
                >
                  {day.closed ? "Closed" : `${day.open}–${day.close}`}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ================================================== Closing CTA =====
          End on a peak, not a valley. The peak-end rule says the last thing
          a user sees is what they remember. */}
      <section aria-labelledby="closing-heading" className="mt-band text-center">
        <h2 id="closing-heading" className="display text-4xl text-ink sm:text-5xl">
          Ready to skip the line?
        </h2>
        <p className="mx-auto mt-snug max-w-[44ch] text-base text-muted">
          Order ahead, pay cash on pickup, and spend your time on something better.
        </p>
        <div className="mt-heading flex justify-center">
          <ButtonLink href="#menu" size="lg">
            Browse the menu
          </ButtonLink>
        </div>
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

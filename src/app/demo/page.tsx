/**
 * ────────────────────────────────────────────────────────────────────────────
 * TEMPORARY DEMO ROUTE — safe to delete.
 *
 *   rm -rf src/app/demo
 *
 * Renders the redesigned storefront against hardcoded menu data so the design
 * can be viewed without a Supabase project attached. It imports the same
 * components the real `/` uses, so what you see here is the real thing —
 * only the data source differs.
 * ────────────────────────────────────────────────────────────────────────────
 */
import Link from "next/link";
import { MenuItemCard } from "@/components/menu-item-card";
import { FeaturedCarousel, type FeaturedItem } from "@/components/featured-carousel";
import { FlavorFilter } from "@/components/flavor-filter";
import { SearchField } from "@/components/search-field";
import { ButtonLink } from "@/components/ui/button";
import type { MenuItem } from "@/types/database";

const drink = (
  id: string,
  name: string,
  flavor: string,
  price: number,
  description: string,
  is_available = true
): MenuItem => ({
  id,
  name,
  description,
  flavor,
  category: "Coffee",
  price,
  image_url: null,
  is_available,
  created_at: "2026-01-01T00:00:00Z",
});

const ITEMS: MenuItem[] = [
  drink("1", "Spanish Latte", "Vanilla", 140, "Espresso with condensed milk, served hot or over ice."),
  drink("2", "Midnight Mocha", "Mocha", 155, "Dark chocolate, double espresso and a thin layer of cream."),
  drink("3", "Salted Caramel Cold Brew", "Caramel", 165, "Eighteen-hour cold brew, salted caramel, oat milk."),
  drink("4", "Hazelnut Cortado", "Hazelnut", 130, "Equal parts espresso and steamed milk, roasted hazelnut."),
  drink("5", "Classic Americano", "Black", 110, "Two shots over hot water. Nothing else."),
  drink("6", "Biscoff Latte", "Caramel", 170, "Speculoos syrup, espresso, crushed biscuit on top."),
  drink("7", "Matcha Espresso Fusion", "Matcha", 175, "Ceremonial matcha layered under a ristretto shot.", false),
  drink("8", "Vanilla Sweet Cream Brew", "Vanilla", 150, "Cold brew with a slow pour of vanilla sweet cream."),
];

/** Stand-in review scores; the real page computes these from the ratings table. */
const RATINGS: Record<string, { average: number; count: number }> = {
  "1": { average: 4.8, count: 42 },
  "2": { average: 4.6, count: 28 },
  "3": { average: 4.9, count: 63 },
  "4": { average: 4.2, count: 11 },
  "5": { average: 4.0, count: 9 },
  "6": { average: 4.7, count: 35 },
  "8": { average: 4.4, count: 17 },
};

export default function DemoPage() {
  const flavors = Array.from(new Set(ITEMS.map((i) => i.flavor))).sort();

  const featured: FeaturedItem[] = ITEMS.filter((i) => i.is_available)
    .map((item) => ({
      item,
      averageRating: RATINGS[item.id]?.average ?? null,
      ratingCount: RATINGS[item.id]?.count ?? 0,
    }))
    .sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0))
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-10">
      <p className="rounded-md border border-line-strong bg-raised px-4 py-2.5 text-xs text-ink-soft">
        <strong className="font-semibold text-ink">Demo data.</strong> This route
        renders the storefront from hardcoded drinks so it can be viewed without a
        Supabase project. Delete it with <code className="font-mono">rm -rf src/app/demo</code>.
      </p>

      {/* ================= Hero ================= */}
      <section className="relative overflow-hidden rounded-xl border border-line bg-card px-5 py-8 sm:px-8 sm:py-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-32 h-[26rem] w-[26rem] rounded-full bg-raised"
        />

        <div className="relative grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-12">
          <div>
            <p className="text-2xs font-semibold uppercase tracking-[0.18em] text-muted">
              Pickup only &middot; Cash on pickup
            </p>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Your coffee, ready
              <br className="hidden sm:block" /> when you are.
            </h1>

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
            <p className="text-sm text-muted">{ITEMS.length} drinks</p>
          </div>

          <SearchField className="md:hidden" />

          {/* Stacks below sm: the chip row bleeds past its padding (-mx-4) to sit
              flush with the screen edge, which would slide it under a sibling
              on the same line. */}
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <FlavorFilter flavors={flavors} />
            <Link
              href="/demo#menu"
              className="text-xs font-medium text-ink-soft underline underline-offset-4 transition-colors duration-150 ease-hi hover:text-ink"
            >
              Clear filters
            </Link>
          </div>
        </div>

        <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {ITEMS.map((item) => (
            <li key={item.id} className="flex">
              <MenuItemCard
                item={item}
                averageRating={RATINGS[item.id]?.average ?? null}
                ratingCount={RATINGS[item.id]?.count ?? 0}
              />
            </li>
          ))}
        </ul>
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

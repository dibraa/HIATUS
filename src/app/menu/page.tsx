import Link from "next/link";
import type { Metadata } from "next";
import { MenuItemCard } from "@/components/menu-item-card";
import { MenuFilters, buildHref } from "@/components/menu-filters";
import { SearchField } from "@/components/search-field";
import { OrderProgress } from "@/components/order-progress";
import { TicketBar, TicketRail } from "@/components/menu/ticket";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getServerToken } from "@/lib/server-token";
import {
  categoryCounts,
  fetchActiveOrder,
  fetchFavoriteIds,
  fetchMenu,
  fetchRatingStats,
} from "@/lib/customer-data";
import { orderCode } from "@/lib/format";

export const metadata: Metadata = { title: "Menu" };

/**
 * The menu, laid out like the counter: categories on the left, the drinks in
 * the middle, and the order you are building on a ticket on the right.
 * Below `lg` the sidebar becomes the category chip row and the ticket folds
 * into a bar pinned above the phone tab bar.
 *
 * Every filter is a URL (`?category=…&flavor=…&q=…`), so it survives the back
 * button and can be shared. Sign-in is enforced by the proxy (/menu is in
 * AUTH_REQUIRED_PREFIXES).
 */
export default async function MenuPage({
  searchParams,
}: {
  searchParams: Promise<{ flavor?: string; category?: string; q?: string }>;
}) {
  const { flavor, category, q } = await searchParams;
  const query = q?.trim() ?? "";
  const token = (await getServerToken()) ?? "";

  const [menu, ratingStats, favoriteIds, activeOrder] = await Promise.all([
    fetchMenu(),
    fetchRatingStats(),
    fetchFavoriteIds(token),
    fetchActiveOrder(token),
  ]);

  const items = menu ?? [];
  const categories = categoryCounts(items);
  // Flavours are listed for the CHOSEN category, so the chip row never offers
  // a combination that returns nothing.
  const flavors = Array.from(
    new Set(items.filter((i) => !category || i.category === category).map((i) => i.flavor))
  ).sort();

  const needle = query.toLowerCase();
  const visible = items.filter((item) => {
    if (category && item.category !== category) return false;
    if (flavor && item.flavor !== flavor) return false;
    if (!needle) return true;
    return [item.name, item.flavor, item.category, item.description ?? ""].some((s) =>
      s.toLowerCase().includes(needle)
    );
  });
  const isFiltered = Boolean(flavor || category || query);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <h1 className="display text-[clamp(2.5rem,6vw,3.75rem)] leading-[0.9] text-ink">{category ?? "The menu"}</h1>
        <p className="text-sm text-muted">
          {visible.length} {visible.length === 1 ? "item" : "items"}
          {query && (
            <>
              {" "}matching <span className="font-semibold text-ink">&ldquo;{query}&rdquo;</span>
            </>
          )}
        </p>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[12rem_minmax(0,1fr)_20rem]">
        {/* Categories, from lg. Below that the chip row in MenuFilters shows. */}
        <nav aria-label="Menu categories" className="sticky top-24 hidden gap-1 lg:grid">
          <SideLink href={buildHref({ query })} current={!category} label="All" count={items.length} />
          {categories.map((c) => (
            <SideLink
              key={c.name}
              href={buildHref({ query, category: c.name })}
              current={category === c.name}
              label={c.name}
              count={c.count}
            />
          ))}
        </nav>

        <div className="min-w-0">
          {activeOrder && (
            <Link
              href={`/orders/${activeOrder.id}`}
              className="ui-caps mb-4 flex min-h-11 items-center justify-between gap-3 rounded-2xl bg-inverse-card px-4 text-2xs text-inverse-card-fg ring-1 ring-line lg:hidden"
            >
              <span>
                {orderCode(activeOrder.id)} · {activeOrder.status === "ready" ? "Ready for pickup" : "On its way"}
              </span>
              <span>Track &rarr;</span>
            </Link>
          )}

          <SearchField query={query} flavor={flavor} />
          <div className="mt-4 flex flex-col gap-3">
            <MenuFilters
              categories={categories.map((c) => c.name)}
              flavors={flavors}
              state={{ category, flavor, query }}
              categoryRowClassName="lg:hidden"
            />
            {isFiltered && (
              <Link
                href="/menu"
                className="ui-caps inline-flex min-h-11 items-center self-start text-2xs text-accent-ink underline underline-offset-4 hover:text-ink"
              >
                Clear filters
              </Link>
            )}
          </div>

          <div className="mt-6">
            {menu === null ? (
              <EmptyState
                as="h2"
                title="We couldn't load the menu"
                body="Something went wrong on our end. Try refreshing the page."
                action={<ButtonLink href="/menu" variant="outline">Try again</ButtonLink>}
              />
            ) : items.length === 0 ? (
              <EmptyState as="h2" title="The menu is being set up" body="Nothing has been added yet. Check back shortly." />
            ) : visible.length === 0 ? (
              <EmptyState
                as="h2"
                title="Nothing matches that"
                body={
                  query
                    ? `Nothing matched “${query}”. Try a different word or clear the filters.`
                    : "There is nothing in this part of the menu right now."
                }
                action={<ButtonLink href="/menu" variant="outline">Show everything</ButtonLink>}
              />
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
                {visible.map((item) => {
                  const stat = ratingStats.get(item.id);
                  return (
                    <li key={item.id} className="flex">
                      <MenuItemCard
                        item={item}
                        averageRating={stat?.average ?? null}
                        ratingCount={stat?.count ?? 0}
                        isFavorite={favoriteIds.has(item.id)}
                        isLoggedIn
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <aside aria-label="Your order" className="sticky top-24 hidden gap-3 lg:grid">
          {activeOrder && (
            <Link
              href={`/orders/${activeOrder.id}`}
              className="block rounded-2xl bg-inverse-card p-4 text-inverse-card-fg ring-1 ring-line"
            >
              <span className="ui-caps flex justify-between text-2xs">
                <span>{orderCode(activeOrder.id)}</span>
                <span>Track &rarr;</span>
              </span>
              <span className="mt-3 block">
                <OrderProgress status={activeOrder.status} tone="inverse" />
              </span>
            </Link>
          )}
          <TicketRail />
        </aside>
      </div>

      {/* Keeps the last row clear of the pinned ticket bar below lg. */}
      <div aria-hidden="true" className="h-20 lg:hidden" />
      <TicketBar />
    </div>
  );
}

function SideLink({ href, current, label, count }: { href: string; current: boolean; label: string; count: number }) {
  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      className={`ui-caps flex min-h-11 items-center justify-between rounded-xl px-3.5 text-2xs transition-colors ${
        current ? "bg-ink text-surface" : "text-ink-soft hover:bg-raised hover:text-ink"
      }`}
    >
      {label}
      <span className={current ? "opacity-70" : "text-muted"}>{count}</span>
    </Link>
  );
}

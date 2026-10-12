import Link from "next/link";
import type { ReactNode } from "react";
import { MenuItemCard } from "@/components/menu-item-card";
import { CategoryBlocks } from "@/components/home/category-blocks";
import { LiveOrderCard } from "@/components/home/live-order-card";
import { UsualOrders } from "@/components/home/usual-orders";
import { formatTime } from "@/lib/hours";
import type { ActiveOrder } from "@/lib/customer-data";
import type { RatingStat } from "@/lib/ratings";
import type { BusinessHours, MenuItem, OrderPreset } from "@/types/database";

/**
 * The signed-in home, answering a regular's questions in order:
 *   1. is my order ready?   — the live order card, or the same card saying
 *                              no order is in progress;
 *   2. order my usual        — saved orders, one tap each;
 *   3. browse                — category blocks into the menu, then what's
 *                              popular today.
 * The full menu lives on /menu; this page is the way in, not the catalogue.
 */
export function CustomerHome({
  firstName,
  open,
  today,
  activeOrder,
  typicalMinutes,
  presets,
  menu,
  categories,
  popular,
  ratingStats,
  favoriteIds,
}: {
  firstName: string;
  open: boolean;
  today: BusinessHours | null;
  activeOrder: ActiveOrder | null;
  typicalMinutes: number;
  presets: OrderPreset[];
  menu: MenuItem[];
  categories: { name: string; count: number }[];
  popular: MenuItem[];
  ratingStats: Map<string, RatingStat>;
  favoriteIds: Set<string>;
}) {
  const status = open
    ? `Open · until ${formatTime(today!.close)}`
    : today && !today.closed
      ? `Closed · today ${formatTime(today.open)} – ${formatTime(today.close)}`
      : "Closed today";

  return (
    <div className="flex flex-col gap-section">
      <section aria-labelledby="home-greeting">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h1 id="home-greeting" className="display text-[clamp(2.75rem,8vw,4.5rem)] leading-[0.9] text-ink">
            {greeting()},<br />
            {firstName}.
          </h1>
          <OpenStatus open={open}>{status}</OpenStatus>
        </div>
        {/* The card always holds its place; with nothing on its way it says
            so plainly. No button here, so "Order again" stays the page's one
            primary action. */}
        {activeOrder ? (
          <LiveOrderCard order={activeOrder} typicalMinutes={typicalMinutes} />
        ) : (
          <section
            aria-label="No order in progress"
            className="mt-6 rounded-2xl bg-inverse-card p-5 text-inverse-card-fg ring-1 ring-line sm:p-6"
          >
            <p className="ui-caps text-2xs text-inverse-card-muted">No order in progress</p>
            <p className="mt-1.5">When you order ahead, you can follow it here, from the counter to ready.</p>
          </section>
        )}
      </section>

      {presets.length > 0 && (
        <Section id="usual" title="Your usual" link={{ href: "/favorites", label: "All saved" }}>
          <UsualOrders presets={presets.slice(0, 2)} menu={menu} />
        </Section>
      )}

      {categories.length > 0 && (
        <Section id="browse" title="Browse" link={{ href: "/menu", label: "Full menu" }}>
          <CategoryBlocks categories={categories} />
        </Section>
      )}

      {popular.length > 0 && (
        <Section id="popular" title="Popular today">
          <ul className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            {popular.map((item) => {
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
        </Section>
      )}
    </div>
  );
}

function Section({
  id,
  title,
  link,
  children,
}: {
  id: string;
  title: string;
  link?: { href: string; label: string };
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={`${id}-heading`}>
      <div className="mb-4 flex items-end justify-between gap-3">
        <h2 id={`${id}-heading`} className="display text-4xl text-ink sm:text-5xl">{title}</h2>
        {link && (
          <Link href={link.href} className="inline-flex min-h-11 items-center text-sm font-medium text-accent-ink underline-offset-4 hover:underline">
            {link.label}
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function OpenStatus({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <span className="ui-caps inline-flex items-center gap-2 text-2xs text-ink-soft">
      <span aria-hidden="true" className={`h-2 w-2 rounded-full ${open ? "bg-success" : "bg-muted"}`} />
      {children}
    </span>
  );
}

/** "Good morning" in the shop's own time zone, whatever the server's is. */
function greeting(): string {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Manila", hour: "2-digit", hour12: false }).format(new Date())
  );
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

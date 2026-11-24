import { ViewTransition } from "react";
import { DrinkBuilder } from "@/components/welcome-v2/drink-builder";
import { DrinkParade } from "@/components/welcome-v2/drink-parade";
import { HeroV2 } from "@/components/welcome-v2/hero-v2";
import { ReviewsMarquee, type Review } from "@/components/welcome-v2/reviews-marquee";
import { SectionNav, type NavSection } from "@/components/welcome-v2/section-nav";
import { VisitV2 } from "@/components/welcome-v2/visit-v2";
import { popularItems } from "@/lib/customer-data";
import { aggregateRatings } from "@/lib/ratings";
import { isOpenNow, type getSettings } from "@/lib/settings";
import type { MenuItem, Rating } from "@/types/database";
import styles from "./welcome-v2.module.css";

/**
 * The page, top to bottom: arrive (hero), the favourites one at a time
 * (parade), make one your own (builder), what guests say (reviews), come by
 * (visit). Sections with nothing to show drop out rather than render empty.
 *
 * Full-bleed: each section sets its own inner width. The negative margins
 * take back <main>'s vertical padding so the hero meets the navbar and the
 * closing strip meets the footer.
 */
export function GuestWelcomeV2({
  settings,
  items,
  ratings,
}: {
  settings: Awaited<ReturnType<typeof getSettings>>;
  items: MenuItem[];
  ratings: Rating[];
}) {
  const { today } = isOpenNow(settings.businessHours);
  const open = settings.loaded && (settings.availability?.open ?? isOpenNow(settings.businessHours).open);

  const stats = aggregateRatings(ratings);
  const drinksOnly = items.filter((item) => item.item_type !== "food");
  const favorites = popularItems(drinksOnly.length > 0 ? drinksOnly : items, stats, 5);

  const names = new Map(items.map((item) => [item.id, item.name]));
  const reviews: Review[] = ratings
    .filter((r) => r.comment?.trim())
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 16)
    .map((r) => ({ id: r.id, text: r.comment!.trim(), stars: r.rating, item: names.get(r.menu_item_id) ?? null }));

  // Same conditions as the render below, so the nav lists only sections on the page.
  const sections: NavSection[] = [
    { id: "v2-hero-heading", label: "Welcome" },
    ...(favorites.length > 0
      ? [
          { id: "v2-parade-heading", label: "Favorites" },
          { id: "v2-builder-heading", label: "Build yours" },
        ]
      : []),
    ...(reviews.length > 0 ? [{ id: "v2-reviews-heading", label: "Reviews" }] : []),
    { id: "v2-visit-heading", label: "Visit" },
  ];

  return (
    // Cross-fades the page in and out on navigation to and from `/` (browser default animation).
    <ViewTransition>
      <div className={`full-bleed -my-8 sm:-my-10 ${styles.page}`}>
        <HeroV2 open={open} today={today} />
        {favorites.length > 0 && <DrinkParade drinks={favorites} />}
        {favorites.length > 0 && <DrinkBuilder drinks={favorites} />}
        {reviews.length > 0 && <ReviewsMarquee reviews={reviews} />}
        <VisitV2 open={open} hours={settings.businessHours} today={today} />
        <SectionNav sections={sections} />
      </div>
    </ViewTransition>
  );
}

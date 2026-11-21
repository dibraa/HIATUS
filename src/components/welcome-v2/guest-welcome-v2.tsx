import { DrinkBuilder } from "@/components/welcome-v2/drink-builder";
import { DrinkParade } from "@/components/welcome-v2/drink-parade";
import { HeroV2 } from "@/components/welcome-v2/hero-v2";
import { ReviewsMarquee, type Review } from "@/components/welcome-v2/reviews-marquee";
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

  return (
    // motion-ok: this page animates even under prefers-reduced-motion (globals.css).
    <div className={`full-bleed motion-ok -my-8 sm:-my-10 ${styles.page}`}>
      <HeroV2 open={open} today={today} />
      {favorites.length > 0 && <DrinkParade drinks={favorites} />}
      {favorites.length > 0 && <DrinkBuilder drinks={favorites} />}
      {reviews.length > 0 && <ReviewsMarquee reviews={reviews} />}
      <VisitV2 open={open} hours={settings.businessHours} today={today} />
    </div>
  );
}

import type { Rating } from "@/types/database";

export type RatingStat = { average: number; count: number };

/**
 * Rolls a flat list of ratings up per menu item.
 *
 * Done in one pass over a single query rather than one query per card — the
 * menu grid renders every item at once, so per-item lookups would be an N+1.
 */
export function aggregateRatings(ratings: Rating[]): Map<string, RatingStat> {
  const totals = new Map<string, { sum: number; count: number }>();

  for (const rating of ratings) {
    const entry = totals.get(rating.menu_item_id) ?? { sum: 0, count: 0 };
    entry.sum += rating.rating;
    entry.count += 1;
    totals.set(rating.menu_item_id, entry);
  }

  const stats = new Map<string, RatingStat>();
  for (const [menuItemId, { sum, count }] of totals) {
    stats.set(menuItemId, { average: sum / count, count });
  }
  return stats;
}

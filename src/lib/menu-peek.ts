import { categoryCounts, popularItems } from "@/lib/customer-data";
import type { RatingStat } from "@/lib/ratings";
import type { MenuItem } from "@/types/database";

/** The guest welcome's glimpse of the menu: a few drinks, and every category. */
export type MenuPeek = { items: MenuItem[]; categories: string[] };

/**
 * What a guest sees of the menu: the same "popular" pick as the signed-in
 * home (available only, best-rated first, stable between loads), so the two
 * pages never disagree about what's good.
 */
export function pickMenuPeek(items: MenuItem[], stats: Map<string, RatingStat>, count = 3): MenuPeek {
  return { items: popularItems(items, stats, count), categories: categoryCounts(items).map((c) => c.name) };
}

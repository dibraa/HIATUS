import type { MenuItem } from "@/types/database";

/** The guest welcome's glimpse of the menu: a few drinks, and every category. */
export type MenuPeek = { items: MenuItem[]; categories: string[] };

type RawRating = { menu_item_id: unknown; rating: number };

/**
 * Picks what a guest sees of the menu: available items only (a sneak peek
 * should never advertise something they cannot order), best-rated first, with
 * unrated items after in the menu's own order so the selection is stable
 * between loads rather than shuffling.
 *
 * Ratings arrive with `menu_item_id` either as a plain id or as a populated
 * `{ _id }` object, depending on the endpoint — both are normalised here.
 */
export function pickMenuPeek(items: MenuItem[], ratings: RawRating[], count = 3): MenuPeek {
  const totals = new Map<string, { sum: number; n: number }>();
  for (const r of ratings) {
    const raw = r.menu_item_id;
    const id = typeof raw === "object" && raw !== null ? (raw as { _id?: string })._id : (raw as string);
    if (!id) continue;
    const t = totals.get(id) ?? { sum: 0, n: 0 };
    t.sum += r.rating;
    t.n += 1;
    totals.set(id, t);
  }
  const average = (id: string) => {
    const t = totals.get(id);
    return t ? t.sum / t.n : 0;
  };

  const available = items.filter((item) => item.is_available);
  const picked = available
    .map((item, index) => ({ item, index, score: average(item.id) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, count)
    .map(({ item }) => item);

  const categories = Array.from(new Set(items.map((i) => i.category).filter(Boolean))).sort();
  return { items: picked, categories };
}

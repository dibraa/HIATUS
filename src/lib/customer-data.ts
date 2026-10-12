import { apiJson } from "@/lib/api-client";
import { ACTIVE_STATUSES } from "@/lib/order-meta";
import { aggregateRatings, type RatingStat } from "@/lib/ratings";
import type { MenuItem, Order, OrderPreset, Rating } from "@/types/database";

/**
 * Server-side loaders shared by the signed-in home and the menu page, so both
 * read the API the same way.
 *
 * Mongo documents arrive with `_id`; populated references (a rating's
 * `menu_item_id`, a favorite's) arrive as `{ _id }` objects on some endpoints
 * and plain ids on others. `idOf` folds both into a string at the edge, so
 * nothing downstream has to know.
 */
function idOf(value: unknown): string {
  if (typeof value === "object" && value !== null) return (value as { _id?: string })._id ?? "";
  return typeof value === "string" ? value : "";
}

/** `null` (not `[]`) when the API is unreachable: "down" and "empty" need different messages. */
export async function fetchMenu(): Promise<MenuItem[] | null> {
  const raw = await apiJson<(MenuItem & { _id: string })[]>("/menu").catch(() => null);
  return raw ? raw.map((m) => ({ ...m, id: m._id ?? m.id })) : null;
}

export async function fetchRatingStats(): Promise<Map<string, RatingStat>> {
  const raw = await apiJson<(Rating & { _id: string })[]>("/menu/ratings/all").catch(() => []);
  return aggregateRatings(raw.map((r) => ({ ...r, id: r._id ?? r.id, menu_item_id: idOf(r.menu_item_id) })));
}

export async function fetchFavoriteIds(token: string): Promise<Set<string>> {
  const rows = await apiJson<{ menu_item_id: unknown }[]>("/account/favorites", { token }).catch(() => []);
  return new Set(rows.map((f) => idOf(f.menu_item_id)).filter(Boolean));
}

export async function fetchPresets(token: string): Promise<OrderPreset[]> {
  const raw = await apiJson<(OrderPreset & { _id: string })[]>("/account/presets", { token }).catch(() => []);
  return raw.map((p) => ({ ...p, id: p._id ?? p.id }));
}

/** `items` only when the list endpoint includes them; the card falls back to the total. */
export type ActiveOrder = Order & { id: string; items?: { item_name: string; quantity?: number }[] };

/** The customer's most recent order that is still on its way (pending → ready). */
export async function fetchActiveOrder(token: string): Promise<ActiveOrder | null> {
  const raw = await apiJson<(ActiveOrder & { _id: string })[]>("/orders", { token }).catch(() => []);
  return (
    raw
      .map((o) => ({ ...o, id: o._id ?? o.id }))
      .filter((o) => ACTIVE_STATUSES.includes(o.status))
      .sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null
  );
}

/** Available items, best-rated first, menu order breaking ties (stable between loads). */
export function popularItems(items: MenuItem[], stats: Map<string, RatingStat>, count: number): MenuItem[] {
  return items
    .map((item, index) => ({ item, index, score: stats.get(item.id)?.average ?? 0 }))
    .filter(({ item }) => item.is_available)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, count)
    .map(({ item }) => item);
}

/** Categories with how many items each holds, alphabetical. */
export function categoryCounts(items: MenuItem[]): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const item of items) if (item.category) counts.set(item.category, (counts.get(item.category) ?? 0) + 1);
  return [...counts].map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name));
}

import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { CheckerBand } from "@/components/ui/checker";
import { MenuItemCard } from "@/components/menu-item-card";
import { aggregateRatings } from "@/lib/ratings";
import type {
  FavoriteItem,
  MenuItem,
  OrderPreset,
  Rating,
} from "@/types/database";
import { PresetList } from "./preset-list";

export const metadata: Metadata = { title: "Saved" };

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const supabase = await createClient();

  const [{ data: favorites }, { data: presets }, { data: menu }, { data: ratings }] =
    await Promise.all([
      supabase.rpc("my_favorites"),
      supabase
        .from("order_presets")
        .select("*")
        .order("created_at", { ascending: false })
        .returns<OrderPreset[]>(),
      // The full menu is needed to re-price presets at today's prices, and it
      // is a few dozen rows — cheaper than a query per preset line.
      supabase.from("menu_items").select("*").returns<MenuItem[]>(),
      supabase.from("ratings").select("*").returns<Rating[]>(),
    ]);

  const favoriteItems = (favorites as FavoriteItem[] | null) ?? [];
  const presetList = presets ?? [];
  const menuItems = menu ?? [];
  const ratingStats = aggregateRatings(ratings ?? []);

  // The favourites RPC returns menu columns under `menu_item_id`; the card
  // component wants a MenuItem, so the shapes are reconciled once here rather
  // than by giving the card a second prop shape to understand.
  const asMenuItems: MenuItem[] = favoriteItems.map((f) => ({
    id: f.menu_item_id,
    name: f.name,
    description: f.description,
    flavor: f.flavor,
    category: f.category,
    price: f.price,
    image_url: f.image_url,
    is_available: f.is_available,
    created_at: f.favorited_at,
  }));

  const nothingSaved = favoriteItems.length === 0 && presetList.length === 0;

  return (
    <div className="py-2">
      <PageHeader
        title="Saved"
        description="The drinks you keep coming back to, and the orders you have saved to repeat."
      />

      {nothingSaved ? (
        <EmptyState
          title="Nothing saved yet"
          body="Tap the heart on any drink to save it here, or save a whole order from your cart to reorder it in one tap."
          action={<ButtonLink href="/">Browse the menu</ButtonLink>}
        />
      ) : (
        <div className="flex flex-col gap-10">
          {/* ---------- Saved orders ---------- */}
          {presetList.length > 0 && (
            <section aria-labelledby="presets-heading">
              <h2
                id="presets-heading"
                className="mb-3 text-xl font-semibold tracking-tight text-ink"
              >
                Your usual
              </h2>
              <p className="mb-4 max-w-[60ch] text-sm text-muted">
                Saved orders are re-priced at today&rsquo;s menu each time you
                load one, so you always pay the current price.
              </p>
              <PresetList presets={presetList} menu={menuItems} />
            </section>
          )}

          {favoriteItems.length > 0 && presetList.length > 0 && (
            <CheckerBand size="sm" className="h-1.5 opacity-70" />
          )}

          {/* ---------- Favourite drinks ---------- */}
          {favoriteItems.length > 0 && (
            <section aria-labelledby="favorites-heading">
              <h2
                id="favorites-heading"
                className="mb-4 text-xl font-semibold tracking-tight text-ink"
              >
                Favourite drinks
              </h2>

              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {asMenuItems.map((item) => {
                  const stat = ratingStats.get(item.id);
                  return (
                    <li key={item.id} className="flex">
                      <MenuItemCard
                        item={item}
                        averageRating={stat?.average ?? null}
                        ratingCount={stat?.count ?? 0}
                        isFavorite
                        isLoggedIn
                      />
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

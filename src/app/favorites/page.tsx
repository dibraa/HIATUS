import type { Metadata } from "next";
import { getServerToken } from "@/lib/server-token";
import { apiJson } from "@/lib/api-client";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { Hairline } from "@/components/ui/hairline";
import { MenuItemCard } from "@/components/menu-item-card";
import { aggregateRatings } from "@/lib/ratings";
import type { MenuItem, OrderPreset, Rating } from "@/types/database";
import { PresetList } from "./preset-list";

export const metadata: Metadata = { title: "Saved" };
export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const token = await getServerToken();

  const [favsRaw, presetsRaw, menuRaw, ratingsRaw] = await Promise.all([
    apiJson<{ menu_item_id: MenuItem & { _id: string } }[]>("/account/favorites", { token: token ?? undefined }).catch(() => []),
    apiJson<(OrderPreset & { _id: string })[]>("/account/presets", { token: token ?? undefined }).catch(() => []),
    apiJson<(MenuItem & { _id: string })[]>("/menu").catch(() => []),
    apiJson<(Rating & { _id: string })[]>("/menu/ratings/all").catch(() => []),
  ]);

  const favoriteItems: MenuItem[] = favsRaw
    .map((f) => f.menu_item_id)
    .filter(Boolean)
    .map((item) => ({ ...item, id: item._id ?? item.id }));

  const presetList: OrderPreset[] = presetsRaw.map((p) => ({ ...p, id: p._id ?? p.id }));
  const menuItems: MenuItem[] = menuRaw.map((m) => ({ ...m, id: m._id ?? m.id }));
  const ratingStats = aggregateRatings(ratingsRaw.map((r) => ({ ...r, id: r._id ?? r.id })));

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
          {presetList.length > 0 && (
            <section aria-labelledby="presets-heading">
              <h2 id="presets-heading" className="mb-3 display text-xl text-ink">Your usual</h2>
              <p className="mb-4 max-w-[60ch] text-sm text-muted">
                Saved orders are re-priced at today&rsquo;s menu each time you load one.
              </p>
              <PresetList presets={presetList} menu={menuItems} />
            </section>
          )}

          {favoriteItems.length > 0 && presetList.length > 0 && <Hairline />}

          {favoriteItems.length > 0 && (
            <section aria-labelledby="favorites-heading">
              <h2 id="favorites-heading" className="mb-4 display text-xl text-ink">Favourite drinks</h2>
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {favoriteItems.map((item) => {
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

import { GuestWelcome } from "@/components/welcome/guest-welcome";
import { CustomerHome } from "@/components/home/customer-home";
import { getCurrentUser } from "@/lib/auth";
import { getServerToken } from "@/lib/server-token";
import { getSettings, isOpenNow } from "@/lib/settings";
import { pickMenuPeek } from "@/lib/menu-peek";
import {
  categoryCounts,
  fetchActiveOrder,
  fetchFavoriteIds,
  fetchMenu,
  fetchPresets,
  fetchRatingStats,
  popularItems,
} from "@/lib/customer-data";

/**
 * `/` serves two audiences:
 *   - signed out: the shop's welcome (components/welcome);
 *   - signed in: the customer home (components/home) — the live order or a
 *     "start an order" welcome, saved orders, categories, what's popular.
 * The full menu lives on /menu.
 *
 * getCurrentUser() returns null without a request when there is no token, so
 * a guest waits only on the menu, ratings and settings the welcome uses.
 */
export default async function HomePage() {
  const [user, settings, menu, ratingStats] = await Promise.all([
    getCurrentUser(),
    getSettings(),
    fetchMenu(),
    fetchRatingStats(),
  ]);
  const items = menu ?? [];

  if (!user) {
    return <GuestWelcome settings={settings} peek={pickMenuPeek(items, ratingStats)} />;
  }

  const token = (await getServerToken()) ?? "";
  const [activeOrder, presets, favoriteIds] = await Promise.all([
    fetchActiveOrder(token),
    fetchPresets(token),
    fetchFavoriteIds(token),
  ]);
  const { open, today } = isOpenNow(settings.businessHours);
  const firstName =
    user.profile?.full_name?.trim().split(/\s+/)[0] || user.email.split("@")[0];

  return (
    <CustomerHome
      firstName={firstName}
      open={open}
      today={today}
      activeOrder={activeOrder}
      typicalMinutes={settings.ordering.default_prep_minutes}
      presets={presets}
      menu={items}
      categories={categoryCounts(items)}
      popular={popularItems(items, ratingStats, 4)}
      ratingStats={ratingStats}
      favoriteIds={favoriteIds}
    />
  );
}

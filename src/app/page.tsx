import { Suspense } from "react";
import { GuestWelcomeV2 } from "@/components/welcome-v2/guest-welcome-v2";
import { WelcomeSkeleton } from "@/components/welcome-v2/welcome-skeleton";
import { CustomerHome } from "@/components/home/customer-home";
import { CustomerHomeSkeleton } from "@/components/home/customer-home-skeleton";
import { getCurrentUser } from "@/lib/auth";
import { aggregateRatings } from "@/lib/ratings";
import { getServerToken } from "@/lib/server-token";
import { getSettings, isOpenNow } from "@/lib/settings";
import {
  categoryCounts,
  fetchActiveOrder,
  fetchFavoriteIds,
  fetchMenu,
  fetchPresets,
  fetchRatings,
  popularItems,
} from "@/lib/customer-data";

/**
 * `/` serves two audiences:
 *   - signed out: the shop's welcome (components/welcome-v2): hero, drink
 *     parade, drink builder, guest reviews, visit;
 *   - signed in: the customer home (components/home) — the live order or a
 *     "start an order" welcome, saved orders, categories, what's popular.
 * The full menu lives on /menu.
 *
 * getCurrentUser() returns null without a request when there is no token, so
 * a guest waits only on the menu, ratings and settings the welcome uses.
 *
 * The loading state lives here rather than in a loading.tsx, which cannot tell
 * the two audiences apart: the token cookie (read instantly) picks the
 * skeleton, and the data streams in behind it.
 */
export default async function HomePage() {
  const token = await getServerToken();
  return (
    <Suspense fallback={token ? <CustomerHomeSkeleton /> : <WelcomeSkeleton />}>
      <Home />
    </Suspense>
  );
}

async function Home() {
  const [user, settings, menu, ratings] = await Promise.all([
    getCurrentUser(),
    getSettings(),
    fetchMenu(),
    fetchRatings(),
  ]);
  const items = menu ?? [];

  if (!user) {
    return <GuestWelcomeV2 settings={settings} items={items} ratings={ratings} />;
  }

  const ratingStats = aggregateRatings(ratings);

  const token = (await getServerToken()) ?? "";
  const [activeOrder, presets, favoriteIds] = await Promise.all([
    fetchActiveOrder(token),
    fetchPresets(token),
    fetchFavoriteIds(token),
  ]);
  const { today } = isOpenNow(settings.businessHours);
  const open = settings.loaded && (settings.availability?.open ?? isOpenNow(settings.businessHours).open);
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

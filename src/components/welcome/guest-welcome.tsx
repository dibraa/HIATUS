import { MenuPeek } from "@/components/welcome/menu-peek";
import { ShopTour } from "@/components/welcome/shop-tour";
import { VisitSection } from "@/components/welcome/visit-section";
import { WelcomeHero } from "@/components/welcome/welcome-hero";
import type { MenuPeek as MenuPeekData } from "@/lib/menu-peek";
import { isOpenNow, type getSettings } from "@/lib/settings";

/**
 * What a signed-out visitor sees at `/`: the shop itself — arrive, a peek at
 * the menu, look around, come by. Product pages and ordering stay behind
 * sign-in (see AUTH_REQUIRED_PREFIXES); this page's job is to make someone
 * want to walk in, or sign up to order.
 *
 * `peek` with no items (menu empty, or the API unreachable) drops the section
 * rather than showing an empty grid; the rest of the page needs no menu.
 */
export function GuestWelcome({
  settings,
  peek,
}: {
  settings: Awaited<ReturnType<typeof getSettings>>;
  peek: MenuPeekData;
}) {
  const { open, today } = isOpenNow(settings.businessHours);
  const hasMenuPeek = peek.items.length > 0;

  return (
    <div className="flex flex-col gap-section">
      <WelcomeHero open={open} today={today} hasMenuPeek={hasMenuPeek} />
      {hasMenuPeek && <MenuPeek peek={peek} />}
      <ShopTour />
      <VisitSection hours={settings.businessHours} shopInfo={settings.shopInfo} />
    </div>
  );
}

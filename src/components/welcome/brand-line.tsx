import { SHOP_PLACE } from "@/content/shop";

/**
 * The brand line between the menu peek and the tour: the stamp's tagline, set
 * once at full size. The stamp turns it in a ring at the corner of the photo;
 * here the page says it out loud.
 *
 * It sits on the plain cream ground, not a panel of its own, so the page keeps
 * its beat of photo, cards, dark panel. The one orange word is the page's
 * accent, used the way the hero's last line uses it. Under it, one quiet mono
 * line of where the shop is; the coordinates join it only once they are the
 * shop's own pin (SHOP_PLACE in content/shop.ts).
 *
 * The size is its own clamp rather than `text-7xl`: the line is the page's one
 * oversized moment, and at the hero's 96px cap it reads as a second headline.
 */
export function BrandLine() {
  return (
    <section aria-labelledby="brand-line-heading" className="text-center">
      <h2
        id="brand-line-heading"
        className="display text-[clamp(3rem,1.4rem+7vw,8.5rem)] text-ink"
      >
        Take that
        <br />
        much needed <span className="text-accent-ink">break.</span>
      </h2>
      <p className="ui-caps mt-stack flex flex-wrap justify-center gap-x-4 gap-y-1 text-2xs text-muted">
        <span>{SHOP_PLACE.town}</span>
        {SHOP_PLACE.coordinates && (
          <>
            <span aria-hidden="true">·</span>
            <span className="numeric">{SHOP_PLACE.coordinates}</span>
          </>
        )}
      </p>
    </section>
  );
}

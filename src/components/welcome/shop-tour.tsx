import Image from "next/image";
import { SHOP_QUOTE, SHOP_TOUR } from "@/content/shop";

/**
 * "Look around": the room's corners as one even row on the espresso panel,
 * the page's "stepping inside" moment.
 *
 * The panel stays inside the page's content column rather than breaking out
 * full-bleed: edge-to-edge chrome with a three-across grid inside is what made
 * the section read as scattered. One contained box, one even grid.
 *
 * Kept deliberately quiet — every photo the same 4:3 size (the subjects are
 * long and low: a mirror on a wall, a shelf, a row of cups, so a portrait crop
 * would cut them off), and only two text voices per spot: a caps title and one
 * plain line. The Bisaya line from the cups closes the section rather than
 * competing with its heading.
 *
 * `inverse-card` rather than `cta`: the CTA token flips to cream in dark mode
 * and this panel has to stay dark in both themes. The hairline ring is for
 * dark mode, where `inverse-card` sits a shade BELOW the page (it was tuned
 * for a caption card on the pine panel) and would otherwise lose its edge; on
 * cream the same ring is all but invisible and the espresso fill does the work.
 *
 * The panel sits closer to its neighbours than a plain section gap: a third of
 * the `section` step comes off the gap above (120 -> 80px on desktop). Below,
 * while it is the page's last section (the story is hidden until written), it
 * also takes back main's bottom padding, so the footer lands about as close
 * as the brand line above (160 -> 88px). With the story after it, the normal
 * section gap stands.
 */
export function ShopTour() {
  return (
    <section
      id="inside"
      aria-labelledby="tour-heading"
      className="-mt-[calc(var(--hi-space-section)/3)] scroll-mt-20 last:-mb-[calc(var(--hi-space-section)/3+2rem)]"
    >
      <div className="rounded-2xl bg-inverse-card py-band text-inverse-card-fg ring-1 ring-line">
        {/* Side inset grows with the band: a 24px side under 104px of headroom
            left the heading pinned to the panel's edge on desktop. */}
        <div className="mx-auto max-w-6xl px-5 sm:px-8 lg:px-12">
          <h2 id="tour-heading" className="display text-6xl">
            Look around
          </h2>

          <div className="mt-heading grid gap-4 sm:grid-cols-3 sm:gap-x-4 sm:gap-y-8">
            {SHOP_TOUR.map((spot) => (
              <figure key={spot.title}>
                <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
                  <Image
                    src={spot.image}
                    alt={spot.alt}
                    fill
                    placeholder="blur"
                    sizes="(min-width: 1152px) 368px, (min-width: 640px) 31vw, 92vw"
                    className="object-cover"
                  />
                </div>
                <figcaption className="mt-4">
                  <span className="ui-caps block text-2xs">{spot.title}</span>
                  <span className="mt-1 block text-pretty text-sm text-inverse-card-muted">{spot.caption}</span>
                </figcaption>
              </figure>
            ))}
          </div>

          <figure className="mt-heading grid gap-2 border-t border-inverse-card-muted/25 pt-6">
            <blockquote lang={SHOP_QUOTE.lang}>
              <p className="display text-3xl">&ldquo;{SHOP_QUOTE.text}&rdquo;</p>
            </blockquote>
            <figcaption className="text-sm text-inverse-card-muted">{SHOP_QUOTE.translation}</figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}

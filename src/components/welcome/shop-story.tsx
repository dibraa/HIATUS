import Image from "next/image";
import { SHOP_STORY } from "@/content/shop";

/**
 * "How Hiatus started": the founding year large on the left, a few sentences
 * on the right, in the hero's own 5:7 split so the page opens and closes on
 * the same grid.
 *
 * Renders nothing until SHOP_STORY has lines. The words are the shop's to
 * write, and a guest should never meet a placeholder; the year and the photo
 * are each optional on top of that.
 */
export function ShopStory() {
  const { since, lines, photo } = SHOP_STORY;
  if (lines.length === 0) return null;

  return (
    <section
      aria-labelledby="story-heading"
      className="grid items-start gap-heading lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]"
    >
      {since ? (
        <p>
          <span className="eyebrow block text-muted">Since</span>
          {/* pb-2: the display face's sub-1 leading would otherwise sit the
              year right on top of the heading when the columns stack. */}
          <span className="display mt-snug block pb-2 text-7xl text-ink">{since}</span>
        </p>
      ) : (
        // Holds the left column so the story stays in the right one.
        <span aria-hidden="true" className="max-lg:hidden" />
      )}

      <div>
        <h2 id="story-heading" className="display text-5xl text-ink">
          How Hiatus started
        </h2>
        <div className="mt-heading grid max-w-[62ch] gap-4 text-pretty text-lg text-ink-soft">
          {lines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
        {photo && (
          <div className="matte mt-heading">
            <div className="matte-inner relative aspect-[5/2]">
              <Image
                src={photo.image}
                alt={photo.alt}
                fill
                placeholder="blur"
                sizes="(min-width: 1024px) 640px, 92vw"
                className="object-cover"
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

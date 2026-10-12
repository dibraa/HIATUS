"use client";

import { useState } from "react";
import Image, { type StaticImageData } from "next/image";
import heroCups from "@/assets/hero-ube-cups.jpg";
import heroMirror from "@/assets/hero-mirror.jpg";
import heroShelf from "@/assets/hero-shelf.jpg";

type HeroPhoto = { src: StaticImageData; alt: string; caption: string };

/** The drinks first, then the place. Order is the order of the 01/02/03 picker. */
const PHOTOS: HeroPhoto[] = [
  {
    src: heroCups,
    alt: "Two ube lattes on the counter, each cup with a handwritten note",
    caption: "Ube latte — handwritten, every cup",
  },
  {
    src: heroMirror,
    alt: "The mirror wall on corrugated metal, reflecting the shop's plants and shelves",
    caption: "The mirror wall",
  },
  {
    src: heroShelf,
    alt: "The curio shelf: old books, a green skull bottle and hand-drawn cups",
    caption: "The curio shelf",
  },
];

/**
 * The hero's arch and the 01/02/03 picker that changes what is in it.
 *
 * Returns two siblings rather than one wrapper because they live in different
 * places: the arch sits in the stack's grid cell among the letters, and the
 * picker is pinned to the pine panel's bottom edge (the panel is its nearest
 * positioned ancestor). Both read the same state, so they cannot disagree.
 *
 * It only ever changes when the visitor asks. An auto-advancing hero moves
 * the thing someone is reading or about to click, so there is no timer here.
 */
export function HeroPhotoPicker() {
  const [active, setActive] = useState(0);

  return (
    <>
      {/* The pine ring is a cut-out, not a shadow: it clears the letters around
          the arch so the photo reads as standing among them. */}
      <figure className="relative z-10 -mt-[17vw] aspect-[3/4] w-[46vw] max-w-56 overflow-hidden rounded-b-2xl rounded-t-full bg-inverse-bg shadow-[0_0_0_10px_var(--hi-inverse-bg)] sm:mt-0 sm:w-[17vw] sm:[grid-area:1/1] lg:w-[clamp(9.5rem,17vw,15rem)]">
        {PHOTOS.map((photo, i) => (
          <Image
            key={photo.caption}
            src={photo.src}
            alt={photo.alt}
            fill
            // The first photo gets the priority. The other two are lazy, but
            // they sit inside the viewport (opacity is not visibility), so the
            // browser still fetches them right after it — about 10 KB each at
            // this size, and it is what makes a switch instant.
            loading={i === 0 ? "eager" : "lazy"}
            fetchPriority={i === 0 ? "high" : "auto"}
            placeholder="blur"
            sizes="(min-width: 1024px) 240px, (min-width: 640px) 17vw, 46vw"
            aria-hidden={i !== active}
            className={`object-cover transition-opacity duration-(--hi-dur-slow) ease-(--hi-ease-out) ${
              i === active ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
      </figure>

      <div className="absolute inset-x-4 bottom-12 z-20 flex items-center justify-between gap-4 sm:inset-x-auto sm:right-8 sm:bottom-14 lg:right-10 xl:bottom-7">
        <p aria-live="polite" className="ui-caps text-2xs text-inverse-fg">
          {PHOTOS[active].caption}
        </p>
        <div role="group" aria-label="Shop photos" className="flex">
          {PHOTOS.map((photo, i) => (
            <button
              key={photo.caption}
              type="button"
              aria-pressed={i === active}
              aria-label={`Photo ${i + 1}: ${photo.caption}`}
              onClick={() => setActive(i)}
              className={`ui-caps min-h-11 min-w-11 rounded-sm text-xs transition-colors focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-inverse-fg ${
                i === active
                  ? "text-inverse-fg shadow-[inset_0_-2px_0_var(--hi-inverse-display)]"
                  : "text-inverse-muted hover:text-inverse-fg"
              }`}
            >
              {String(i + 1).padStart(2, "0")}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

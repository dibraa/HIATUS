import type { StaticImageData } from "next/image";
import exterior from "@/assets/shop/new/exterior.webp";
import seating from "@/assets/shop/new/seating.webp";
import quietCorner from "@/assets/shop/new/quiet-corner.webp";
import drinks from "@/assets/shop/new/drinks.webp";

/**
 * The guest welcome page's words and pictures, kept out of the components so
 * the shop's story can be edited without touching layout.
 *
 * Every caption describes only what its photograph shows. Anything richer —
 * where a piece came from, who writes the cups — comes from the shop, not from
 * a guess.
 */

export const SHOP_ROOM = {
  image: exterior,
  alt: "The Hiatus exterior with wooden railings, plants, and people sitting outside",
  caption: "Hiatus Headquarters",
};

export type TourSpot = {
  title: string;
  caption: string;
  image: StaticImageData;
  alt: string;
  position?: string;
};

/** "Look around": the corners a guest will find walking in, in walking order.
 *  Captions stay one short line each — the section is an even row of three. */
export const SHOP_TOUR: TourSpot[] = [
  {
    title: "Around the table",
    caption: "A shared table inside the shop.",
    image: seating,
    alt: "People seated around a wooden table beside a mirror and corrugated wall",
    position: "50% 55%",
  },
  {
    title: "A quiet corner",
    caption: "Shelves, plants, and a place to sit.",
    image: quietCorner,
    alt: "Two chairs and a small table beneath a shelf of decorations",
    position: "50% 30%",
  },
  {
    title: "On the table",
    caption: "Drinks and food, ready to enjoy.",
    image: drinks,
    alt: "Three cold drinks beside plates of food on a cafe table",
    position: "50% 45%",
  },
];

/** The line written on the cups, set as the tour's pull-quote. `lang` is
 *  Cebuano (ceb), so a screen reader pronounces it rather than spelling it. */
export const SHOP_QUOTE = {
  text: "Salamat sa pag-hapit.",
  lang: "ceb",
  translation: "Thank you for dropping by.",
};

/** Where "Get directions" goes, on the hero's door sign and in the footer. A
 *  Maps SEARCH for now; swap in the shop's own Maps listing link once known. */
export const SHOP_DIRECTIONS_URL =
  "https://www.google.com/maps/search/?api=1&query=Hiatus+Coffee+Malaybalay";

/** The brand line between the menu peek and the tour. `coordinates` is the
 *  shop's own map pin (e.g. "8.15° N, 125.13° E"); null hides it, and the
 *  line shows only the town. */
export const SHOP_PLACE = {
  town: "Malaybalay, Bukidnon",
  coordinates: null as string | null,
};

/** "How Hiatus started", closing the guest welcome. The section renders only
 *  once `lines` has text — every word here comes from the shop, never a guess.
 *  `since` is the founding year ("2021"); `photo` is an optional picture of the
 *  people behind the counter (add it under src/assets/shop/ and import it). */
export const SHOP_STORY: {
  since: string | null;
  lines: string[];
  photo: { image: StaticImageData; alt: string } | null;
} = {
  since: null,
  lines: [],
  photo: null,
};

/** Social links shown in the site's footer. */
export const SHOP_SOCIALS = [
  { label: "@hiatuscoffee_ph", href: "https://www.instagram.com/hiatuscoffee_ph/" },
  { label: "Facebook", href: "https://www.facebook.com/hiatuscoffee" },
];

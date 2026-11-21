import exterior from "@/assets/shop/new/exterior.webp";

/**
 * The guest welcome page's words and pictures, kept out of the components so
 * the shop's details can be edited without touching layout.
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

/** The line written on the cups, shown in the welcome's visit section. `lang`
 *  is Cebuano (ceb), so a screen reader pronounces it rather than spelling it. */
export const SHOP_QUOTE = {
  text: "Salamat sa pag-hapit.",
  lang: "ceb",
  translation: "Thank you for dropping by.",
};

/** Where "Get directions" goes, in the welcome's visit section and in the
 *  footer. A Maps SEARCH for now; swap in the shop's own Maps listing link
 *  once known. */
export const SHOP_DIRECTIONS_URL =
  "https://www.google.com/maps/search/?api=1&query=Hiatus+Coffee+Malaybalay";

/** The town, shown on the welcome's location card. */
export const SHOP_PLACE = {
  town: "Malaybalay, Bukidnon",
};

/** Social links shown in the site's footer and the welcome's visit section. */
export const SHOP_SOCIALS = [
  { label: "@hiatuscoffee_ph", href: "https://www.instagram.com/hiatuscoffee_ph/" },
  { label: "Facebook", href: "https://www.facebook.com/hiatuscoffee" },
];

import type { StaticImageData } from "next/image";
import room from "@/assets/shop/room.jpg";
import tinWall from "@/assets/shop/tin-wall.jpg";
import curioShelf from "@/assets/shop/curio-shelf.jpg";
import counterNotes from "@/assets/shop/counter-notes.jpg";

/**
 * The guest welcome page's words and pictures, kept out of the components so
 * the shop's story can be edited without touching layout.
 *
 * Every caption describes only what its photograph shows. Anything richer —
 * where a piece came from, who writes the cups — comes from the shop, not from
 * a guess.
 */

export const SHOP_ROOM = {
  image: room,
  alt: "Inside Hiatus: a wavy arched mirror, warm lamps, a potted plant and woven baskets on wooden shelves",
  caption: "Hiatus Headquarters",
};

export type TourSpot = {
  title: string;
  caption: string;
  image: StaticImageData;
  alt: string;
};

/** "Look around": the corners a guest will find walking in, in walking order.
 *  Captions stay one short line each — the section is an even row of three. */
export const SHOP_TOUR: TourSpot[] = [
  {
    title: "The tin wall",
    caption: "A long mirror on corrugated tin.",
    image: tinWall,
    alt: "A long wood-framed mirror on a corrugated tin wall, reflecting plants and shelves",
  },
  {
    title: "The curio shelf",
    caption: "Rizal, Tagu-taguan, and a woven owl.",
    image: curioShelf,
    alt: "A wooden curio shelf with a framed print, Filipino books, a woven owl, figurines and illustrated cups",
  },
  {
    title: "The counter",
    caption: "Your name and a note, handwritten on the cup.",
    image: counterNotes,
    alt: "Close-up of two ube lattes with handwritten notes: \"Have a noice day\" in a heart around the name Jai, and a drawn cat beside the name Sam",
  },
];

/** The line written on the cups, set as the tour's pull-quote. `lang` is
 *  Cebuano (ceb), so a screen reader pronounces it rather than spelling it. */
export const SHOP_QUOTE = {
  text: "Salamat sa inyong pag-apit.",
  lang: "ceb",
  translation: "Thank you for dropping by.",
};

/** Only handles printed on the shop's own material. The Facebook page is named
 *  "Hiatus Coffee" there but its URL is not, so it is left out until known. */
export const SHOP_SOCIALS = [
  { label: "@hiatuscoffee_ph", href: "https://www.instagram.com/hiatuscoffee_ph/" },
];

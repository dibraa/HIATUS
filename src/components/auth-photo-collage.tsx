import Image, { type StaticImageData } from "next/image";
import type { CSSProperties } from "react";
import photo0 from "@/assets/shop/new/exterior.webp";
import photo1 from "@/assets/shop/new/coffee-poster.webp";
import photo2 from "@/assets/shop/new/coffee-cups.webp";
import photo3 from "@/assets/shop/new/drinks.webp";
import photo4 from "@/assets/shop/new/decor-details.webp";
import photo5 from "@/assets/shop/new/banana-drink.webp";
import photo6 from "@/assets/shop/new/quiet-corner.webp";
import photo7 from "@/assets/shop/new/caps.webp";
import photo8 from "@/assets/shop/new/ube-drink.webp";
import photo9 from "@/assets/shop/new/resource-logo.webp";
import photo10 from "@/assets/shop/new/cafe-gathering.webp";
import photo11 from "@/assets/shop/new/coffee-pair.webp";
import photo12 from "@/assets/shop/new/resource-mirror.webp";
import photo13 from "@/assets/shop/new/resource-shelf.webp";
import photo14 from "@/assets/shop/new/seating.webp";
import photo15 from "@/assets/shop/new/pine-drink.webp";
import photo16 from "@/assets/shop/new/outdoors.webp";
import photo17 from "@/assets/shop/new/shared-moments.webp";
import photo18 from "@/assets/shop/new/yellow-melody.webp";
import photo19 from "@/assets/shop/new/riverside.webp";
import styles from "./auth-photo-collage.module.css";

type Photo = { image: StaticImageData; shape: "landscape" | "portrait" | "square" };
const photos: Record<"left" | "right", Photo[]> = {
  left: [
    { image: photo0, shape: "portrait" },
    { image: photo1, shape: "portrait" },
    { image: photo2, shape: "portrait" },
    { image: photo3, shape: "portrait" },
    { image: photo4, shape: "portrait" },
    { image: photo5, shape: "portrait" },
    { image: photo6, shape: "portrait" },
    { image: photo7, shape: "portrait" },
    { image: photo8, shape: "portrait" },
    { image: photo9, shape: "square" },
  ],
  right: [
    { image: photo10, shape: "portrait" },
    { image: photo11, shape: "portrait" },
    { image: photo12, shape: "landscape" },
    { image: photo13, shape: "landscape" },
    { image: photo14, shape: "square" },
    { image: photo15, shape: "portrait" },
    { image: photo16, shape: "square" },
    { image: photo17, shape: "square" },
    { image: photo18, shape: "portrait" },
    { image: photo19, shape: "landscape" },
  ],
};

// Full-canvas positions are fixed so server and client render the same scattered scene.
const placements = [
  [.01, .03, 1.15, -13, 3], [.22, .07, .8, 15, 5],
  [.04, .44, .78, -5, 8], [.19, .32, .92, 9, 6],
  [.05, .73, 1, -16, 2], [.34, .93, .85, 14, 3],
  [0, .95, .76, 5, 9], [.33, .54, .8, -17, 5],
  [.23, .72, .94, -9, 7], [.43, .02, .63, 11, 1],
  [.98, .02, 1.07, 13, 2], [.76, .1, .85, -12, 4],
  [.96, .44, .95, -7, 4], [.69, .48, .8, 16, 5],
  [.84, .3, .9, 7, 7], [.97, .82, .85, 12, 6],
  [.64, .95, .9, -10, 3], [.8, .95, .8, 17, 8],
  [.75, .69, 1.05, -9, 8], [.56, .04, .85, -12, 1],
];
const priorities = [0, 6, 12, 1, 7, 13, 2, 14, 8, 15, 3, 9, 16, 17, 4, 10, 18, 5, 11, 19];

/** A non-interactive photo background beneath the opaque auth ticket. */
export function AuthPhotoCollage() {
  const frames = [...photos.left, ...photos.right];
  return <div aria-hidden="true" className={styles.background}>
    {frames.map((photo, index) => {
      const [x, y, scale, tilt, layer] = placements[index];
      const priority = priorities[index];
      const visibility = priority < 2 ? "always" : priority < 6 ? "tablet" : priority < 12 ? "laptop" : "desktop";
      const placement = {
        "--x": x, "--y": y, "--scale": scale, "--tilt": tilt + "deg",
        "--ratio": photo.shape === "landscape" ? 4 / 3 : photo.shape === "portrait" ? 3 / 4 : 1,
        "--compact-x": priority === 0 ? .05 : .95, "--compact-y": priority === 0 ? 0 : 1,
        "--tablet-x": [0, 1, 0, 1, .05, .95][priority] ?? x,
        "--tablet-y": [0, .99, .5, .03, .5, .99][priority] ?? y,
        zIndex: layer,
      } as CSSProperties;
      return <figure key={photo.image.src} data-photo-slot={index} data-photo-priority={priority} style={placement} className={styles.frame + " " + styles[visibility]}>
        <span className={styles.photo}>
          <Image src={photo.image} alt="" fill placeholder="blur" sizes="(min-width: 1280px) 260px, (min-width: 1024px) 230px, (min-width: 640px) 160px, 96px" className={styles.image} />
        </span>
      </figure>;
    })}
  </div>;
}

import Image, { type StaticImageData } from "next/image";
import type { ReactNode } from "react";
import exterior from "@/assets/shop/new/exterior.webp";
import quietCorner from "@/assets/shop/new/quiet-corner.webp";
import drinks from "@/assets/shop/new/drinks.webp";
import seating from "@/assets/shop/new/seating.webp";
import { AuthPhotoCollage } from "./auth-photo-collage";
import collageStyles from "./auth-photo-collage.module.css";

/**
 * The shell every auth page (log in, sign up, forgot and reset password) sits
 * in: the form printed on an order ticket — the same object the counter works
 * from — with torn edges (`.ticket-edges` in globals.css) and a dashed tear
 * line above the way out.
 *
 * Login and signup opt into the expanded collage. The simpler recovery
 * layout keeps snapshots of the shop "left on the counter", kept from reading
 * as clutter by three rules:
 *   - few: two a side from `xl` (1280px), three in a small fan below that;
 *   - small, alternating tilts (±3–4°), never two photos overlapping;
 *   - placed by a GRID — the side photos live in real columns either side of
 *     the ticket, so nothing can drift into the form at any width.
 *
 * All of it is decoration: hidden from assistive tech, and no photo is ever
 * between a reader and a field.
 */
export function AuthTicket({
  label,
  title,
  description,
  children,
  footer,
  collage = false,
}: {
  /** The ticket's order line, top right: "Log in", "Sign up"… */
  label: string;
  title: string;
  description?: string;
  /** The form. */
  children: ReactNode;
  /** Below the tear line: the way to the other auth page. */
  footer?: ReactNode;
  /** Full-width photo background for login and signup; recovery keeps the simple layout. */
  collage?: boolean;
}) {
  return (
    <div className={collage ? collageStyles.layout : "mx-auto grid max-w-6xl justify-items-center py-4 sm:py-8 xl:grid-cols-[minmax(0,1fr)_420px_minmax(0,1fr)] xl:gap-x-12"}>
      {collage && <AuthPhotoCollage />}
      {!collage && (
        <div aria-hidden="true" className="hidden w-full max-w-72 flex-col justify-center gap-12 self-stretch justify-self-end xl:flex">
          <Snapshot image={exterior} className="-rotate-4 self-end" aspect="aspect-[4/3]" />
          <Snapshot image={quietCorner} className="w-7/8 rotate-3 self-start" aspect="aspect-[4/3]" />
        </div>
      )}
      <div className={collage ? collageStyles.ticketColumn : "w-full max-w-105"}>
        {!collage && (
          <div aria-hidden="true" className="mb-8 flex justify-center xl:hidden">
            <Snapshot image={exterior} className="w-32 translate-y-2 -rotate-6 sm:w-36" aspect="aspect-[4/3]" sizes="144px" />
            <Snapshot image={drinks} className="relative z-10 -mx-5 w-32 sm:w-36" aspect="aspect-[4/3]" sizes="144px" />
            <Snapshot image={quietCorner} className="w-32 translate-y-2 rotate-6 sm:w-36" aspect="aspect-[4/3]" sizes="144px" />
          </div>
        )}
        {/* The ticket remains above the decorative background and keeps its original markup. */}
        <section
          aria-labelledby="auth-title"
          className="ticket-edges relative w-full bg-card px-5 pb-6 pt-8 sm:px-8"
        >
          <div className="mb-6 flex items-baseline justify-between gap-4 border-b-2 border-dashed border-line-strong pb-4">
            <span className="ui-caps text-2xs text-muted">Hiatus · counter</span>
            <span className="display text-2xl text-ink">{label}</span>
          </div>

          {/* One fluid step (35 -> 58px): the ticket is a fixed 420px column,
              so the headline needs to track the viewport only on phones, and
              `.display` already carries the sub-1 line-height. */}
          <h1 id="auth-title" className="display text-5xl text-ink">{title}</h1>
          {description && <p className="mt-snug max-w-[38ch] text-ink-soft">{description}</p>}
          <div className="mt-stack">{children}</div>

          {footer && (
            <div className="mt-6 border-t-2 border-dashed border-line-strong pt-4 text-sm text-muted">
              {footer}
            </div>
          )}
        </section>
      </div>
      {!collage && (
        <div aria-hidden="true" className="hidden w-full max-w-72 flex-col justify-center gap-12 self-stretch justify-self-start xl:flex">
          <Snapshot image={drinks} className="w-11/12 rotate-4 self-start" aspect="aspect-[4/3]" />
          <Snapshot image={seating} className="w-4/5 -rotate-3 self-end" aspect="aspect-[3/4]" />
        </div>
      )}
    </div>
  );
}

/** One photo in the shop's cream matte frame, tilted by the caller. */
function Snapshot({
  image,
  className = "",
  aspect,
  sizes = "288px",
}: {
  image: StaticImageData;
  className?: string;
  aspect: string;
  sizes?: string;
}) {
  return (
    <figure className={`rounded-xl bg-card p-1.5 ${className}`}>
      <Image
        src={image}
        alt=""
        placeholder="blur"
        sizes={sizes}
        className={`${aspect} w-full rounded-lg object-cover`}
      />
    </figure>
  );
}

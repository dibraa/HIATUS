import Image, { type StaticImageData } from "next/image";
import type { ReactNode } from "react";
import room from "@/assets/shop/room.jpg";
import curioShelf from "@/assets/shop/curio-shelf.jpg";
import counterNotes from "@/assets/shop/counter-notes.jpg";
import ubeCup from "@/assets/hero-ube-cup.jpg";

/**
 * The shell every auth page (log in, sign up, forgot and reset password) sits
 * in: the form printed on an order ticket — the same object the counter works
 * from — with torn edges (`.ticket-edges` in globals.css) and a dashed tear
 * line above the way out.
 *
 * Around it, snapshots of the shop "left on the counter". Kept from reading
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
}: {
  /** The ticket's order line, top right: "Log in", "Sign up"… */
  label: string;
  title: string;
  description: string;
  /** The form. */
  children: ReactNode;
  /** Below the tear line: the way to the other auth page. */
  footer?: ReactNode;
}) {
  return (
    <div className="mx-auto grid max-w-6xl justify-items-center py-4 sm:py-8 xl:grid-cols-[minmax(0,1fr)_420px_minmax(0,1fr)] xl:gap-x-12">
      {/* Left side, from `xl` (1280px) — at `lg` the tilted corners crowd the
          screen edges, so smaller screens get the fan instead. Offset inward then outward, so the pair reads as
          set down by hand rather than stacked. */}
      <div aria-hidden="true" className="hidden w-full max-w-72 flex-col justify-center gap-12 self-stretch justify-self-end xl:flex">
        <Snapshot image={room} className="-rotate-[4deg] self-end" aspect="aspect-[4/3]" />
        <Snapshot image={curioShelf} className="w-[88%] rotate-3 self-start" aspect="aspect-[4/3]" />
      </div>

      <div className="w-full max-w-[420px]">
        {/* Below `xl`: a short fan of three above the ticket. */}
        <div aria-hidden="true" className="mb-8 flex justify-center xl:hidden">
          <Snapshot image={room} className="w-32 translate-y-2 -rotate-6 sm:w-36" aspect="aspect-[4/3]" sizes="144px" />
          <Snapshot image={counterNotes} className="relative z-10 -mx-5 w-32 sm:w-36" aspect="aspect-[4/3]" sizes="144px" />
          <Snapshot image={curioShelf} className="w-32 translate-y-2 rotate-6 sm:w-36" aspect="aspect-[4/3]" sizes="144px" />
        </div>

        <div className="ticket-edges relative w-full bg-card px-5 pb-6 pt-8 sm:px-8">
          <div className="mb-6 flex items-baseline justify-between gap-4 border-b-[1.5px] border-dashed border-line-strong pb-3.5">
            <span className="ui-caps text-2xs text-muted">Hiatus · counter</span>
            <span className="display text-2xl text-ink">{label}</span>
          </div>

          <h1 className="display text-[clamp(2.75rem,10vw,3.75rem)] leading-[0.9] text-ink">{title}</h1>
          <p className="mb-6 mt-3 max-w-[38ch] text-ink-soft">{description}</p>

          {children}

          {footer && (
            <div className="mt-6 border-t-[1.5px] border-dashed border-line-strong pt-4 text-sm text-muted">
              {footer}
            </div>
          )}
        </div>
      </div>

      {/* Right side, from `xl`: the mirror image of the left's rhythm. */}
      <div aria-hidden="true" className="hidden w-full max-w-72 flex-col justify-center gap-12 self-stretch justify-self-start xl:flex">
        <Snapshot image={counterNotes} className="w-[92%] rotate-[4deg] self-start" aspect="aspect-[4/3]" />
        <Snapshot image={ubeCup} className="w-[78%] -rotate-3 self-end" aspect="aspect-[3/4]" />
      </div>
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

import Image from "next/image";
import { ButtonLink } from "@/components/ui/button";
import { RotatingStamp } from "@/components/welcome/rotating-stamp";
import { SHOP_ROOM } from "@/content/shop";
import { formatTime } from "@/lib/hours";
import type { BusinessHours } from "@/types/database";

/**
 * "Arrive": the room, and the way in.
 *
 * The open/closed status is a sign ON the photograph rather than an eyebrow
 * over the headline — a shop says it is open on its door, not above its name —
 * which leaves the headline the first thing on the page.
 *
 * Source order is headline, then photo, so a screen reader meets the words
 * first. On phones the photo is lifted ABOVE the words with `order-first`: on
 * a page about the place, a small screen should show the place before talking
 * about it, and the sign rides along with it into the first screenful.
 */
export function WelcomeHero({
  open,
  today,
  hasMenuPeek,
}: {
  open: boolean;
  today: BusinessHours | null;
  /** Whether the "On the menu" section renders, so the hero only links to it when it exists. */
  hasMenuPeek: boolean;
}) {
  const todayHours =
    today && !today.closed ? `${formatTime(today.open)} – ${formatTime(today.close)}` : null;
  const status = open
    ? `Open · until ${formatTime(today!.close)}`
    : todayHours
      ? `Closed · today ${todayHours}`
      : "Closed today";

  return (
    <section
      aria-labelledby="welcome-heading"
      className="grid items-end gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12"
    >
      <div>
        <h1
          id="welcome-heading"
          className="display rise text-[clamp(3.5rem,15vw,5.5rem)] leading-[0.88] text-ink [--rise:1] lg:text-[clamp(3.5rem,min(6.4vw,12.5vh),7rem)]"
        >
          A taste
          <br />
          of home,
          <br />
          <span className="text-accent-ink">of Bukidnon.</span>
        </h1>
        {/* More room under the headline (40px) than under the pitch (28px):
            at this type size an equal gap fuses headline, pitch and buttons
            into one block, and the headline stops reading as the lead. */}
        <p className="rise mt-8 max-w-[34ch] text-lg text-ink-soft [--rise:2] lg:mt-10">

          Breathe, slow down, and sip. Welcome to your daily hiatus in the heart of Malaybalay.
        </p>
        <div className="rise mt-7 flex flex-wrap gap-3 [--rise:3] max-sm:flex-col max-sm:items-stretch">
          {/* Ordering is the page's goal, so it carries the fill. The second
              button answers a guest's next question — what is there, and for
              how much — by jumping to the menu peek; with no peek on the page
              (nothing available) it offers returning customers a way in. */}
          <ButtonLink href="/signup" size="lg">
            Order ahead
          </ButtonLink>
          {hasMenuPeek ? (
            <ButtonLink href="#menu-peek" variant="outline" size="lg">
              See the menu
            </ButtonLink>
          ) : (
            <ButtonLink href="/login" variant="outline" size="lg">
              Sign in
            </ButtonLink>
          )}
        </div>
      </div>

      <figure className="matte relative order-first lg:order-none">
        <div className="matte-inner relative aspect-[4/3.4] lg:aspect-auto lg:h-[min(68vh,620px)]">
          {/* The LCP element on phones, where it now leads the page: eager and
              high priority, and deliberately NOT part of the `.rise` entrance
              (see the note on `.rise` in globals.css). */}
          <Image
            src={SHOP_ROOM.image}
            alt={SHOP_ROOM.alt}
            fill
            loading="eager"
            fetchPriority="high"
            placeholder="blur"
            sizes="(min-width: 1024px) 680px, 92vw"
            className="object-cover object-[50%_30%]"
          />
        </div>

        {/* The door sign. Pine when open, cream when closed; the words carry
            the state on their own, so colour is never the only signal. */}
        <figcaption
          className={`absolute bottom-6 right-6 grid gap-1 rounded-lg px-4 py-3 sm:bottom-8 sm:right-8 ${
            open ? "bg-inverse-bg text-inverse-fg" : "bg-card text-ink"
          }`}
        >
          <span className="ui-caps flex items-center gap-2 text-2xs">
            <span
              aria-hidden="true"
              className={`h-2 w-2 shrink-0 rounded-full ${open ? "bg-inverse-display" : "bg-muted"}`}
            />
            {status}
          </span>
          <span className={`ui-caps text-2xs ${open ? "text-inverse-muted" : "text-muted"}`}>
            {SHOP_ROOM.caption}
          </span>
        </figcaption>

        {/* Never above the photo's top edge: the sticky navbar sits right
            there, and on phones (photo first) a stamp lifted over the frame
            collides with it. Desktop: straddling the left edge, below the
            top. Phones: tucked inside the top-right corner. */}
        <RotatingStamp className="absolute right-5 top-5 w-24 lg:-left-14 lg:right-auto lg:top-12 lg:w-32" />
      </figure>
    </section>
  );
}

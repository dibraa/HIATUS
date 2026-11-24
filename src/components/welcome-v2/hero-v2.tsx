import Image from "next/image";
import heroImage from "@/assets/shop/new/ahhhhh.jpeg";
import { ButtonLink } from "@/components/ui/button";
import { doorStatus } from "@/components/welcome-v2/door-status";
import { HeroStage } from "@/components/welcome-v2/hero-stage";
import type { BusinessHours } from "@/types/database";
import styles from "./welcome-v2.module.css";

/** Pill stickers around the photo. x/y place them on the frame; dx/dy is the
 *  direction they drift as the page scrolls. Decorative only. */
const STICKERS = [
  { text: "Lami!", x: "-2%", y: "8%", r: -16, dx: -1, dy: -0.3, tone: "bg-card text-ink" },
  { text: "(˘ᵕ˘)", x: "10%", y: "44%", r: 12, dx: -1, dy: 0, tone: "bg-warning-soft-bg text-ink" },
  { text: "Break time", x: "-4%", y: "70%", r: 20, dx: -1, dy: 0.5, tone: "bg-accent text-accent-fg" },
  { text: "Sarap!", x: "20%", y: "86%", r: -8, dx: -0.4, dy: 1, tone: "bg-secondary text-secondary-fg" },
  { text: "Salamat!", x: "80%", y: "4%", r: 18, dx: 1, dy: -0.4, tone: "bg-danger-soft-bg text-ink" },
  { text: "(っ˘ڡ˘ς)", x: "86%", y: "36%", r: -14, dx: 1, dy: 0, tone: "bg-cta text-cta-fg" },
  { text: "Chill", x: "90%", y: "66%", r: 10, dx: 1, dy: 0.4, tone: "bg-success-soft-bg text-ink" },
  { text: "Kape pa!", x: "70%", y: "88%", r: -20, dx: 0.5, dy: 1, tone: "bg-card text-ink" },
];

/**
 * "Arrive", the playful take: a centred headline with one word on an orange
 * block, the drinks photo below it, and stickers floating around the frame
 * that scatter via GSAP ScrollTrigger as you scroll away.
 */
export function HeroV2({ open, today }: { open: boolean; today: BusinessHours | null }) {
  return (
    <HeroStage className="relative overflow-hidden pb-16 pt-12 sm:pt-16">
      <div className="mx-auto max-w-6xl px-4 text-center">
        <p data-hero-item className="eyebrow text-muted">It’s time for a</p>
        <h1
          id="v2-hero-heading"
          data-hero-item
          className="display mt-5 text-[clamp(3.25rem,1.4rem+7.6vw,8.5rem)] text-ink"
        >
          <span
            data-hero-badge
            className="inline-block -rotate-2 rounded-xl bg-accent px-[0.16em] pt-[0.06em] text-accent-fg"
          >
            Hiatus
          </span>{" "}
          coffee
          <br />
          break
        </h1>
        <p data-hero-item className="mx-auto mt-snug max-w-[40ch] text-lg text-ink-soft">
          Breathe, slow down, and sip. Welcome to your daily hiatus in the heart of Malaybalay.
        </p>
        <div data-hero-item className="mt-stack flex flex-wrap items-center justify-center gap-3">
          <span className={`${styles.spring} inline-flex`}>
            <ButtonLink href="/login" size="lg">
              Order ahead
            </ButtonLink>
          </span>
          <span className={`${styles.spring} inline-flex`}>
            <ButtonLink href="/menu" variant="outline" size="lg">
              See the menu
            </ButtonLink>
          </span>
        </div>
        <p data-hero-item className="ui-caps mt-5 inline-flex items-center gap-2 rounded-full bg-card px-4 py-2 text-2xs text-ink">
          <span aria-hidden="true" className={`h-2 w-2 rounded-full ${open ? "bg-success" : "bg-muted"}`} />
          {doorStatus(open, today)}
        </p>
      </div>

      <div data-hero-scatter className="relative mx-auto mt-12 max-w-4xl px-6 sm:px-10">
        <div data-hero-frame className="matte -rotate-1">
          <div className="matte-inner relative aspect-[4/3] sm:aspect-[16/10]">
            <Image
              src={heroImage}
              alt="Three friends dining together at a wooden table in a warmly lit cafe"
              fill
              loading="eager"
              fetchPriority="high"
              placeholder="blur"
              sizes="(min-width: 1024px) 860px, 92vw"
              className="object-cover object-[50%_45%]"
            />
          </div>
        </div>

        <div aria-hidden="true">
          {STICKERS.map((s) => (
            <span
              key={s.text}
              data-hero-sticker-wrap
              data-r={s.r}
              data-dx={s.dx}
              data-dy={s.dy}
              className="pointer-events-none absolute will-change-transform"
              style={{ left: s.x, top: s.y }}
            >
              <span
                data-hero-sticker
                className={`ui-caps inline-block whitespace-nowrap rounded-full px-3 py-1.5 text-2xs shadow-[var(--hi-shadow-lg)] sm:px-4 sm:py-2 sm:text-xs ${s.tone}`}
              >
                {s.text}
              </span>
            </span>
          ))}
        </div>
      </div>
    </HeroStage>
  );
}

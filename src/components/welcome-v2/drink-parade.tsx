"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ProductImage } from "@/components/ui/product-image";
import { formatPrice } from "@/lib/format";
import { priceForSize } from "@/lib/sizes";
import type { MenuItem } from "@/types/database";
import styles from "./welcome-v2.module.css";

/** One soft tint per slide, so the page changes colour as the drinks pass. */
const TINTS = ["bg-accent-soft", "bg-success-soft-bg", "bg-warning-soft-bg", "bg-danger-soft-bg", "bg-raised"];

/** Spring pull toward the scroll position, and how much speed survives each
 *  frame. Lower damping or higher pull = more wobble when scrolling stops. */
const PULL = 0.1;
const DAMPING = 0.68;

const pad = (n: number) => String(n).padStart(2, "0");
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/**
 * "Crowd favorites": the section pins under the navbar and vertical scrolling
 * slides the drinks past sideways, one per screen, with a counter and a
 * progress bar. The slide position chases the scroll on a spring, so it
 * overshoots and settles; it goes straight into `--p` on the section, and
 * only the active index is React state.
 */
export function DrinkParade({ drinks }: { drinks: MenuItem[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const n = drinks.length;

  useEffect(() => {
    const section = sectionRef.current;
    const pinned = frameRef.current;
    if (!section || !pinned) return;
    let frame = 0;
    let target = 0;
    let pos: number | null = null;
    let velocity = 0;

    const measure = () => {
      // Pinned from the moment the section's top reaches the sticky offset
      // until its bottom does: that stretch is the whole sideways trip.
      const stickyTop = parseFloat(getComputedStyle(pinned).top) || 0;
      const travel = section.offsetHeight - pinned.offsetHeight;
      target = travel > 0 ? clamp01((stickyTop - section.getBoundingClientRect().top) / travel) : 0;
    };

    const tick = () => {
      frame = 0;
      if (pos === null) pos = target; // first paint lands in place, no spring
      velocity = (velocity + (target - pos) * PULL) * DAMPING;
      pos += velocity;
      if (Math.abs(target - pos) < 0.0005 && Math.abs(velocity) < 0.0005) {
        pos = target;
        velocity = 0;
      } else {
        frame = requestAnimationFrame(tick);
      }
      // Overshoot past either end would show empty page, so the ends hold.
      const shown = clamp01(pos);
      section.style.setProperty("--p", String(shown));
      setActive(Math.round(shown * (n - 1)));
    };

    const onScroll = () => {
      measure();
      if (!frame) frame = requestAnimationFrame(tick);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [n]);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="v2-parade-heading"
      className="relative"
      style={{ height: `calc(${n} * (100svh - 4rem))` }}
    >
      <div ref={frameRef} className="sticky top-16 h-[calc(100svh-4rem)] overflow-hidden">
        <div
          className="flex h-full"
          style={{
            width: `${n * 100}%`,
            transform: `translateX(calc(var(--p, 0) * -${((n - 1) / n) * 100}%))`,
          }}
        >
          {drinks.map((item, i) => (
            <div key={item.id} className="h-full" style={{ width: `${100 / n}%` }}>
              <Slide item={item} index={i} total={n} active={i === active} />
            </div>
          ))}
        </div>

        <div className="pointer-events-none absolute left-4 top-6 sm:left-8">
          <p className="eyebrow text-muted">Our favorites</p>
          <h2 id="v2-parade-heading" className="display mt-2 text-4xl text-ink">
            Crowd{" "}
            <span
              className={`${styles.jelly} inline-block rounded-lg bg-secondary px-[0.16em] pt-[0.06em] text-secondary-fg`}
            >
              favorites
            </span>
          </h2>
        </div>

        <div className="absolute inset-x-4 bottom-6 flex items-center gap-4 sm:inset-x-8">
          <span key={active} className={`${styles.bump} numeric text-xs text-ink`} aria-live="polite">
            {pad(active + 1)} / {pad(n)}
          </span>
          <span className="h-1 flex-1 overflow-hidden rounded-full bg-ink/10">
            <span
              className="block h-full rounded-full bg-ink"
              style={{ width: "calc(var(--p, 0) * 85% + 15%)" } as CSSProperties}
            />
          </span>
          <span className="ui-caps text-2xs text-muted">Scroll ↓</span>
        </div>
      </div>
    </section>
  );
}

function Slide({ item, index, total, active }: { item: MenuItem; index: number; total: number; active: boolean }) {
  const price = `${item.pricing_mode !== "fixed" ? "from " : ""}${formatPrice(
    priceForSize(item.price, "S", item.size_pricing, item.pricing_mode),
  )}`;

  return (
    <article
      aria-roledescription="slide"
      aria-label={`${index + 1} of ${total}: ${item.name}`}
      className={`relative grid h-full place-items-center overflow-hidden ${TINTS[index % TINTS.length]}`}
    >
      {/* The giant faded name behind the drink. */}
      <span
        aria-hidden="true"
        className="display pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 whitespace-nowrap text-center text-[min(24vw,22rem)] text-ink/[0.07]"
      >
        {item.name}
      </span>

      <div className="relative grid w-full max-w-5xl items-center gap-6 px-6 pt-16 md:grid-cols-2 md:gap-12 md:pt-0">
        {/* float bobs forever; arrive springs the image in each time this
            slide becomes the active one (the class is re-applied). */}
        <div className={`${styles.float} mx-auto w-[min(58vw,18rem)] md:w-[min(34vw,26rem)]`}>
          <div className={`${active ? styles.arrive : ""} rotate-[-4deg]`}>
            <div className={`${styles.spring} ${styles.lift}`}>
              <ProductImage
                src={item.image_url}
                itemType={item.item_type}
                alt=""
                sizes="(min-width: 768px) 26rem, 58vw"
                rounded="rounded-full"
                className="shadow-[var(--hi-shadow-lg)] ring-8 ring-card"
              />
            </div>
          </div>
        </div>
        <div className={`${active ? styles.words : ""} text-center md:text-left`}>
          {item.flavor && <p className="eyebrow text-muted">{item.flavor}</p>}
          <h3 className="display mt-3 text-6xl text-ink">{item.name}</h3>
          {item.description && (
            <p className="mx-auto mt-snug line-clamp-3 max-w-[40ch] text-ink-soft md:mx-0">{item.description}</p>
          )}
          <div className="mt-6 flex items-center justify-center gap-4 md:justify-start">
            <span className="numeric text-xl text-ink">{price}</span>
            <Link
              href={`/menu/${item.id}?from=home`}
              className={`${styles.spring} ui-caps inline-flex min-h-11 items-center rounded-full bg-cta px-5 text-2xs text-cta-fg hover:bg-cta-hover`}
            >
              View drink<span className="sr-only">: {item.name}</span>
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

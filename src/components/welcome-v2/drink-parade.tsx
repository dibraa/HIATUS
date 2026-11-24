"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ProductImage } from "@/components/ui/product-image";
import { gsap, useGSAP, HIATUS_DUR, HIATUS_EASE, MOTION_MEDIA } from "@/lib/gsap";
import { formatPrice } from "@/lib/format";
import { priceForSize } from "@/lib/sizes";
import type { MenuItem } from "@/types/database";
import styles from "./welcome-v2.module.css";

/** One soft tint per slide, so the page changes colour as the drinks pass. */
const TINTS = ["bg-accent-soft", "bg-success-soft-bg", "bg-warning-soft-bg", "bg-danger-soft-bg", "bg-raised"];

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * "Crowd favorites": GSAP ScrollTrigger pins the stage below the navbar and
 * scrubs the drinks horizontally with GPU-composited xPercent + scaleX progress.
 * Under prefers-reduced-motion, pinning is disabled and slides stack calmly.
 */
export function DrinkParade({ drinks }: { drinks: MenuItem[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
  const activeRef = useRef(0);
  const [active, setActive] = useState(0);
  const n = drinks.length;

  useGSAP(
    () => {
      const stage = stageRef.current;
      const track = trackRef.current;
      const progressBar = progressRef.current;
      if (!stage || !track || n <= 1) return;

      const mm = gsap.matchMedia();
      mm.add({ motion: MOTION_MEDIA.motion, reduce: MOTION_MEDIA.reduce }, (context) => {
        if (context.conditions?.reduce) return;

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: stage,
            start: "top 64px",
            end: () => `+=${Math.round((n - 1) * window.innerHeight * 1.25)}`,
            pin: true,
            pinSpacing: true,
            scrub: 1.4,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              const next = Math.min(n - 1, Math.max(0, Math.round(self.progress * (n - 1))));
              if (next !== activeRef.current) {
                activeRef.current = next;
                setActive(next);
              }
            },
          },
        });

        // Horizontal scroll tween MUST use ease: "none" so scroll position maps 1:1.
        tl.to(track, {
          xPercent: -((n - 1) / n) * 100,
          ease: "none",
        });

        if (progressBar) {
          gsap.set(progressBar, { scaleX: 1 / n, transformOrigin: "left center" });
          tl.to(progressBar, { scaleX: 1, ease: "none" }, 0);
        }
      });

      return () => mm.revert();
    },
    { scope: sectionRef, dependencies: [n] }
  );

  // Subtle arrival settle on the newly active slide's drink visual and copy.
  useGSAP(
    () => {
      const root = sectionRef.current;
      if (!root) return;
      const slide = root.querySelector<HTMLElement>(`[data-parade-slide="${active}"]`);
      if (!slide) return;
      const visual = slide.querySelector<HTMLElement>("[data-slide-visual]");
      const copy = slide.querySelector<HTMLElement>("[data-slide-copy]");
      const counter = root.querySelector<HTMLElement>("[data-parade-counter]");

      const mm = gsap.matchMedia();
      mm.add({ motion: MOTION_MEDIA.motion, reduce: MOTION_MEDIA.reduce }, (context) => {
        if (context.conditions?.reduce) return;
        if (visual) {
          gsap.fromTo(
            visual,
            { scale: 0.96, rotation: -5.5 },
            { scale: 1, rotation: -4, duration: HIATUS_DUR.reveal, ease: HIATUS_EASE.tactile, overwrite: "auto" }
          );
        }
        if (copy) {
          gsap.fromTo(
            copy,
            { y: 10, opacity: 0.65 },
            { y: 0, opacity: 1, duration: HIATUS_DUR.reveal, ease: HIATUS_EASE.arrive, overwrite: "auto" }
          );
        }
        if (counter) {
          gsap.fromTo(
            counter,
            { y: 3, opacity: 0.6 },
            { y: 0, opacity: 1, duration: HIATUS_DUR.state, ease: HIATUS_EASE.tactile, overwrite: "auto" }
          );
        }
      });

      return () => mm.revert();
    },
    { scope: sectionRef, dependencies: [active] }
  );

  return (
    <section ref={sectionRef} aria-labelledby="v2-parade-heading" className="relative">
      <div
        ref={stageRef}
        className="relative h-[calc(100svh-4rem)] overflow-hidden motion-reduce:h-auto"
      >
        <div
          ref={trackRef}
          className="flex h-full will-change-transform motion-reduce:block motion-reduce:h-auto motion-reduce:!w-full"
          style={{ width: `${n * 100}%` }}
        >
          {drinks.map((item, i) => (
            <div
              key={item.id}
              data-parade-slide={i}
              className="h-full shrink-0 motion-reduce:h-auto motion-reduce:!w-full"
              style={{ width: `${100 / n}%` }}
            >
              <Slide item={item} index={i} total={n} />
            </div>
          ))}
        </div>

        <div className="pointer-events-none absolute left-4 top-6 sm:left-8 motion-reduce:static motion-reduce:px-6 motion-reduce:pt-8">
          <p className="eyebrow text-muted">Our favorites</p>
          <h2 id="v2-parade-heading" className="display mt-2 text-4xl text-ink">
            Crowd{" "}
            <span className="inline-block rounded-lg bg-secondary px-[0.16em] pt-[0.06em] text-secondary-fg">
              favorites
            </span>
          </h2>
        </div>

        <div className="absolute inset-x-4 bottom-6 flex items-center gap-4 sm:inset-x-8 motion-reduce:hidden">
          <span data-parade-counter className="numeric inline-block text-xs text-ink" aria-live="polite">
            {pad(active + 1)} / {pad(n)}
          </span>
          <span className="h-1 flex-1 overflow-hidden rounded-full bg-ink/10">
            <span
              ref={progressRef}
              className="block h-full w-full origin-left rounded-full bg-ink will-change-transform"
              style={{ transform: `scaleX(${1 / Math.max(1, n)})` }}
            />
          </span>
          <span className="ui-caps text-2xs text-muted">Scroll ↓</span>
        </div>
      </div>
    </section>
  );
}

function Slide({ item, index, total }: { item: MenuItem; index: number; total: number }) {
  const price = `${item.pricing_mode !== "fixed" ? "from " : ""}${formatPrice(
    priceForSize(item.price, "S", item.size_pricing, item.pricing_mode)
  )}`;

  return (
    <article
      aria-roledescription="slide"
      aria-label={`${index + 1} of ${total}: ${item.name}`}
      className={`relative grid h-full place-items-center overflow-hidden motion-reduce:py-16 ${TINTS[index % TINTS.length]}`}
    >
      {/* The giant faded name behind the drink. */}
      <span
        aria-hidden="true"
        className="display pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 whitespace-nowrap text-center text-[min(24vw,22rem)] text-ink/[0.07]"
      >
        {item.name}
      </span>

      <div className="relative grid w-full max-w-5xl items-center gap-6 px-6 pt-16 md:grid-cols-2 md:gap-12 md:pt-0">
        <div className="mx-auto w-[min(58vw,18rem)] md:w-[min(34vw,26rem)]">
          <div data-slide-visual className="-rotate-4 will-change-transform">
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
        <div data-slide-copy className="text-center md:text-left">
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

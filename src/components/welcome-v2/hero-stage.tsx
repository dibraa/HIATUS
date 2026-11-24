"use client";

import { useRef, type ReactNode } from "react";
import { gsap, ScrollTrigger, useGSAP, HIATUS_DUR, HIATUS_EASE, MOTION_MEDIA } from "@/lib/gsap";

/**
 * Client animation controller for HeroV2.
 * Coordinates the opening timeline (headline → accent stamp → CTAs → framed photo → stickers),
 * drives the ScrollTrigger-scrubbed sticker scatter, and pauses ambient sticker float offscreen.
 */
export function HeroStage({ children, className }: { children: ReactNode; className?: string }) {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section) return;

      const items = section.querySelectorAll<HTMLElement>("[data-hero-item]");
      const badge = section.querySelector<HTMLElement>("[data-hero-badge]");
      const frame = section.querySelector<HTMLElement>("[data-hero-frame]");
      const scatterRoot = section.querySelector<HTMLElement>("[data-hero-scatter]");
      const stickerWraps = Array.from(section.querySelectorAll<HTMLElement>("[data-hero-sticker-wrap]"));
      const stickers = Array.from(section.querySelectorAll<HTMLElement>("[data-hero-sticker]"));

      const mm = gsap.matchMedia();
      mm.add({ motion: MOTION_MEDIA.motion, reduce: MOTION_MEDIA.reduce }, (context) => {
        if (context.conditions?.reduce) {
          gsap.set(stickerWraps, {
            rotation: (_i, el) => Number((el as HTMLElement).dataset.r || 0),
          });
          return;
        }

        // Initial tilt for decorative stickers before entrance and scatter.
        gsap.set(stickerWraps, {
          rotation: (_i, el) => Number((el as HTMLElement).dataset.r || 0),
        });

        // 1. Calm focal entrance timeline.
        const intro = gsap.timeline({ defaults: { ease: HIATUS_EASE.arrive } });
        if (items.length > 0) {
          intro.from(items, {
            y: 14,
            opacity: 0,
            duration: HIATUS_DUR.focal,
            stagger: 0.12,
            clearProps: "transform,opacity",
          });
        }
        if (badge) {
          intro.from(
            badge,
            {
              scale: 0.94,
              rotation: -4,
              duration: 0.9,
              ease: HIATUS_EASE.tactile,
              clearProps: "scale",
            },
            0.2
          );
        }
        if (frame) {
          intro.from(
            frame,
            {
              y: 18,
              scale: 0.985,
              opacity: 0,
              duration: 1.1,
              clearProps: "y,scale,opacity",
            },
            0.32
          );
        }
        if (stickers.length > 0) {
          intro.from(
            stickers,
            {
              scale: 0.82,
              opacity: 0,
              duration: HIATUS_DUR.reveal,
              stagger: 0.09,
              ease: HIATUS_EASE.tactile,
              clearProps: "scale,opacity",
            },
            0.52
          );
        }

        // 2. Slow ambient breath — paused automatically when the hero scrolls offscreen.
        let bobTween: gsap.core.Tween | null = null;
        if (stickers.length > 0) {
          bobTween = gsap.to(stickers, {
            y: -4,
            duration: 4.2,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            stagger: { each: 0.45, from: "random" },
            delay: 1.3,
          });
          ScrollTrigger.create({
            trigger: section,
            start: "top bottom",
            end: "bottom top",
            onLeave: () => bobTween?.pause(),
            onEnterBack: () => bobTween?.play(),
          });
        }

        // 3. ScrollTrigger-scrubbed scatter with smooth lag and gentler drift.
        if (scatterRoot && stickerWraps.length > 0) {
          gsap.to(stickerWraps, {
            x: (_i, el) => Number((el as HTMLElement).dataset.dx || 0) * 140,
            y: (_i, el) => Number((el as HTMLElement).dataset.dy || 0) * 140,
            rotation: (_i, el) =>
              Number((el as HTMLElement).dataset.r || 0) + Number((el as HTMLElement).dataset.dx || 0) * 6,
            opacity: 0.5,
            ease: "none",
            scrollTrigger: {
              trigger: section,
              start: "top top",
              end: "bottom top",
              scrub: 1.4,
            },
          });
        }
      });

      return () => mm.revert();
    },
    { scope: sectionRef }
  );

  return (
    <section ref={sectionRef} aria-labelledby="v2-hero-heading" className={className}>
      {children}
    </section>
  );
}

"use client";

import { useRef } from "react";
import { gsap, useGSAP, HIATUS_DUR, HIATUS_EASE, MOTION_MEDIA } from "@/lib/gsap";

/**
 * ScrollTrigger-choreographed sign-off wordmark ("hiatus.").
 * Animates each character up smoothly once scrolled into view, honoring reduced motion.
 */
export function WordmarkWave({ text = "hiatus." }: { text?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const letters = el.querySelectorAll<HTMLElement>("[data-wordmark-letter]");
      if (letters.length === 0) return;

      const mm = gsap.matchMedia();
      mm.add({ motion: MOTION_MEDIA.motion, reduce: MOTION_MEDIA.reduce }, (context) => {
        if (context.conditions?.reduce) return;
        gsap.from(letters, {
          yPercent: 20,
          opacity: 0,
          duration: HIATUS_DUR.focal,
          stagger: 0.085,
          ease: HIATUS_EASE.arrive,
          clearProps: "transform,opacity",
          scrollTrigger: {
            trigger: el,
            start: "top 92%",
            once: true,
          },
        });
      });

      return () => mm.revert();
    },
    { scope: ref }
  );

  return (
    <p
      ref={ref}
      aria-hidden="true"
      className="display pointer-events-none relative mt-band -mb-[0.12em] select-none text-center text-[clamp(5rem,27vw,26rem)] leading-[0.8]! normal-case! text-secondary"
    >
      {[...text].map((letter, i) => (
        <span key={i} data-wordmark-letter className="inline-block">
          {letter}
        </span>
      ))}
    </p>
  );
}

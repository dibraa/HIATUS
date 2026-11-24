"use client";

import { useRef, type ReactNode } from "react";
import { gsap, ScrollTrigger, useGSAP, HIATUS_DUR, HIATUS_EASE, MOTION_MEDIA } from "@/lib/gsap";

/**
 * Reusable GSAP entrance container for Server Component lists, grids, and card rows.
 * Keeps content visible in SSR HTML, animates GPU transforms/opacity on mount or
 * viewport entry via ScrollTrigger.batch(), and honors prefers-reduced-motion.
 */
export function GsapStagger({
  children,
  className,
  mode = "scroll",
  selector = ":scope > *",
  y = 10,
  stagger = 0.08,
  duration = HIATUS_DUR.reveal,
  resetKey,
}: {
  children: ReactNode;
  className?: string;
  mode?: "mount" | "scroll";
  selector?: string;
  y?: number;
  stagger?: number;
  duration?: number;
  resetKey?: string | number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = containerRef.current;
      if (!root) return;
      const targets = Array.from(root.querySelectorAll<HTMLElement>(selector));
      if (targets.length === 0) return;

      // Cap total stagger delay so long grids stay calm without making users wait.
      const effectiveStagger = Math.min(stagger, 0.45 / Math.max(1, targets.length));

      const mm = gsap.matchMedia();
      mm.add(
        { motion: MOTION_MEDIA.motion, reduce: MOTION_MEDIA.reduce },
        (context) => {
          const reduce = Boolean(context.conditions?.reduce);
          if (reduce) {
            gsap.fromTo(
              targets,
              { opacity: 0.7 },
              {
                opacity: 1,
                duration: 0.14,
                ease: "power1.out",
                clearProps: "opacity",
              }
            );
            return;
          }

          if (mode === "mount") {
            gsap.from(targets, {
              y,
              opacity: 0,
              duration,
              stagger: effectiveStagger,
              ease: HIATUS_EASE.arrive,
              clearProps: "transform,opacity",
            });
            return;
          }

          gsap.set(targets, { y, opacity: 0 });
          ScrollTrigger.batch(targets, {
            start: "top 90%",
            once: true,
            batchMax: 4,
            onEnter: (batch) => {
              gsap.to(batch, {
                y: 0,
                opacity: 1,
                duration,
                stagger: effectiveStagger,
                ease: HIATUS_EASE.arrive,
                overwrite: true,
                clearProps: "transform,opacity",
              });
            },
          });
        }
      );

      return () => mm.revert();
    },
    { scope: containerRef, dependencies: [mode, selector, y, stagger, duration, resetKey], revertOnUpdate: true }
  );

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}

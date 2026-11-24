"use client";

import { useRef, type ReactNode } from "react";
import { gsap, useGSAP, HIATUS_DUR, HIATUS_EASE, MOTION_MEDIA } from "@/lib/gsap";

/**
 * Animates an SVG polyline stroke draw and accompanying area/point accents on mount.
 * Leaves SVG markup untouched for SSR and renders the final chart immediately under
 * prefers-reduced-motion.
 */
export function GsapLineDraw({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = containerRef.current;
      if (!root) return;
      const line = root.querySelector<SVGGeometryElement>("polyline, path");
      const area = root.querySelector<SVGElement>("polygon");
      const dots = Array.from(root.querySelectorAll<SVGCircleElement>("circle"));
      if (!line) return;

      const mm = gsap.matchMedia();
      mm.add({ motion: MOTION_MEDIA.motion, reduce: MOTION_MEDIA.reduce }, (context) => {
        if (context.conditions?.reduce) return;

        const length = typeof line.getTotalLength === "function" ? line.getTotalLength() : 0;
        const tl = gsap.timeline({ defaults: { ease: HIATUS_EASE.arrive } });

        if (length > 0) {
          gsap.set(line, { strokeDasharray: length, strokeDashoffset: length });
          tl.to(line, {
            strokeDashoffset: 0,
            duration: HIATUS_DUR.focal,
            clearProps: "strokeDasharray,strokeDashoffset",
          });
        }

        if (area) {
          tl.from(
            area,
            { opacity: 0, duration: HIATUS_DUR.reveal, clearProps: "opacity" },
            0.22
          );
        }

        if (dots.length > 0) {
          tl.from(
            dots,
            {
              scale: 0.4,
              opacity: 0,
              transformOrigin: "center center",
              duration: HIATUS_DUR.state,
              stagger: 0.07,
              clearProps: "transform,opacity",
            },
            0.35
          );
        }
      });

      return () => mm.revert();
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}

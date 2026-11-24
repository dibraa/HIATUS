"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export const HIATUS_EASE = {
  arrive: "power2.out",
  tactile: "power2.out",
  smooth: "sine.inOut",
} as const;

export const HIATUS_DUR = {
  feedback: 0.3,
  state: 0.55,
  reveal: 0.85,
  focal: 1.05,
} as const;

export const MOTION_MEDIA = {
  motion: "(prefers-reduced-motion: no-preference)",
  reduce: "(prefers-reduced-motion: reduce)",
  desktop: "(min-width: 768px)",
} as const;

export { gsap, ScrollTrigger, useGSAP };

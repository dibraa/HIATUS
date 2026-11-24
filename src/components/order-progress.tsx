"use client";

import { useRef } from "react";
import { gsap, useGSAP, HIATUS_DUR, HIATUS_EASE, MOTION_MEDIA } from "@/lib/gsap";
import type { OrderStatus } from "@/types/database";

/**
 * The four-step journey of an order, with GSAP scaleX progress fill animation
 * on entry and live status transitions.
 */
const STEPS: { status: OrderStatus; label: string; detail: string }[] = [
  { status: "pending", label: "Received", detail: "We have your order" },
  { status: "preparing", label: "Making", detail: "Being prepared now" },
  { status: "ready", label: "Ready", detail: "Waiting for you" },
  { status: "completed", label: "Collected", detail: "All done" },
];

const TONES = {
  default: { idle: "bg-line", now: "text-ink", done: "text-ink-soft", todo: "text-muted", detail: "text-muted" },
  inverse: {
    idle: "bg-inverse-card-muted/25",
    now: "text-inverse-card-fg",
    done: "text-inverse-card-muted",
    todo: "text-inverse-card-muted",
    detail: "text-inverse-card-muted",
  },
};

export function OrderProgress({
  status,
  tone = "default",
}: {
  status: OrderStatus;
  tone?: keyof typeof TONES;
}) {
  const listRef = useRef<HTMLOListElement>(null);
  const prevIndexRef = useRef<number | null>(null);
  const currentIndex = status === "cancelled" ? -1 : STEPS.findIndex((s) => s.status === status);

  useGSAP(
    () => {
      const list = listRef.current;
      if (!list || currentIndex < 0) return;

      const prev = prevIndexRef.current;
      prevIndexRef.current = currentIndex;

      const allBars = Array.from(list.querySelectorAll<HTMLElement>("[data-step-bar]"));
      const targets =
        prev === null
          ? allBars.slice(0, currentIndex + 1)
          : currentIndex > prev
            ? allBars.slice(prev + 1, currentIndex + 1)
            : [];

      if (targets.length === 0) return;

      const mm = gsap.matchMedia();
      mm.add({ motion: MOTION_MEDIA.motion, reduce: MOTION_MEDIA.reduce }, (context) => {
        if (context.conditions?.reduce) return;
        gsap.fromTo(
          targets,
          { scaleX: 0, transformOrigin: "left center" },
          {
            scaleX: 1,
            duration: HIATUS_DUR.reveal,
            stagger: 0.12,
            ease: HIATUS_EASE.arrive,
            clearProps: "transform",
          }
        );
      });

      return () => mm.revert();
    },
    { scope: listRef, dependencies: [currentIndex] }
  );

  const t = TONES[tone];
  if (status === "cancelled") return null;

  return (
    <ol ref={listRef} className="flex gap-1.5" aria-label="Order progress">
      {STEPS.map((step, i) => {
        const done = i < currentIndex;
        const current = i === currentIndex;

        return (
          <li
            key={step.status}
            aria-current={current ? "step" : undefined}
            className="flex min-w-0 flex-1 flex-col gap-1.5"
          >
            <span
              aria-hidden="true"
              className={`relative h-1.5 w-full overflow-hidden rounded-full ${t.idle}`}
            >
              {(done || current) && (
                <span
                  data-step-bar
                  className="block h-full w-full origin-left rounded-full bg-accent"
                />
              )}
            </span>

            <span className="flex min-w-0 flex-col">
              <span
                className={`truncate text-xs font-semibold ${
                  current ? t.now : done ? t.done : t.todo
                }`}
              >
                {step.label}
                {done && <span className="sr-only"> — done</span>}
              </span>

              {current && (
                <span className={`mt-0.5 truncate text-2xs ${t.detail}`}>
                  {step.detail}
                </span>
              )}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

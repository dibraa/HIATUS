"use client";

import Link from "next/link";
import { useRef } from "react";
import { useCart } from "@/lib/cart-context";
import { gsap, useGSAP, HIATUS_DUR, HIATUS_EASE, MOTION_MEDIA } from "@/lib/gsap";

/**
 * Cart entry point with a live item count and a subtle GSAP feedback pop
 * whenever items are added after hydration.
 */
export function CartBadge({ className = "" }: { className?: string }) {
  const { totalItems, hydrated } = useCart();
  const showCount = hydrated && totalItems > 0;
  const linkRef = useRef<HTMLAnchorElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);
  const prevCountRef = useRef<number | null>(null);

  useGSAP(
    () => {
      if (!hydrated) return;
      const previous = prevCountRef.current;
      prevCountRef.current = totalItems;
      if (previous === null || totalItems <= previous) return;

      const target = countRef.current ?? linkRef.current;
      if (!target) return;

      const mm = gsap.matchMedia();
      mm.add({ motion: MOTION_MEDIA.motion, reduce: MOTION_MEDIA.reduce }, (context) => {
        if (context.conditions?.reduce) {
          gsap.fromTo(target, { opacity: 0.55 }, { opacity: 1, duration: 0.16, clearProps: "opacity" });
          return;
        }
        gsap.fromTo(
          target,
          { scale: 1 },
          {
            scale: 1.12,
            duration: HIATUS_DUR.feedback * 0.75,
            ease: HIATUS_EASE.tactile,
            yoyo: true,
            repeat: 1,
            overwrite: "auto",
            clearProps: "transform",
          }
        );
      });

      return () => mm.revert();
    },
    { scope: linkRef, dependencies: [totalItems, hydrated] }
  );

  return (
    <Link
      ref={linkRef}
      href="/cart"
      aria-label={
        showCount
          ? `Cart, ${totalItems} ${totalItems === 1 ? "item" : "items"}`
          : "Cart, empty"
      }
      className={`ui-caps relative inline-flex h-10 items-center gap-1.5 rounded-md px-2 text-2xs text-ink transition-colors hover:bg-raised ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5 sm:hidden"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        aria-hidden="true"
      >
        <path d="M3 4h2.2l2.1 10.4a2 2 0 0 0 2 1.6h7.5a2 2 0 0 0 2-1.55L20.5 7H6" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="10" cy="20" r="1.4" />
        <circle cx="17.5" cy="20" r="1.4" />
      </svg>

      <span className="hidden sm:inline" aria-hidden="true">
        Cart
      </span>

      {showCount && (
        <span ref={countRef} aria-hidden="true" className="numeric inline-block text-2xs">
          ({totalItems})
        </span>
      )}
    </Link>
  );
}

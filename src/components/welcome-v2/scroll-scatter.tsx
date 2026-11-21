"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Writes how far the first screen has been scrolled (0 to 1) into `--s` on
 * its box, straight to the DOM, so the stickers inside can drift apart
 * without re-rendering anything.
 */
export function ScrollScatter({ className, children }: { className?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const box = ref.current;
    if (!box) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      box.style.setProperty("--s", String(Math.min(1, Math.max(0, window.scrollY / window.innerHeight))));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

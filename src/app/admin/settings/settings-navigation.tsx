"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";

const sections = [
  ["settings-ordering", "Ordering"],
  ["settings-payments", "Payments"],
  ["settings-hours", "Opening hours"],
  ["settings-shop", "Shop details"],
  ["settings-messages", "Order messages"],
  ["settings-api", "API controls"],
] as const;

export function SettingsNavigation() {
  const [active, setActive] = useState<string>(sections[0][0]);
  const [instant, setInstant] = useState(false);
  const destination = useRef<string | null>(null);

  useEffect(() => {
    let frame: number | null = null;
    const elements = sections.map(([id]) => document.getElementById(id)).filter((element): element is HTMLElement => Boolean(element));
    function update() {
      frame = null;
      const line = Math.min(160, window.innerHeight / 4);
      const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
      if (destination.current) {
        const target = document.getElementById(destination.current);
        if (target) {
          const top = target.getBoundingClientRect().top;
          const margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
          // Keep the clicked destination highlighted while smooth scrolling passes other cards.
          if (Math.abs(top - margin) > 2 && !(atBottom && top < window.innerHeight)) return;
        }
        destination.current = null;
      }
      const current = elements.filter(element => element.getBoundingClientRect().top <= line).at(-1) || elements[0];
      const last = elements.at(-1);
      setActive(atBottom && last && last.getBoundingClientRect().top < window.innerHeight ? last.id : current?.id || sections[0][0]);
    }
    function schedule() { if (frame === null) frame = window.requestAnimationFrame(update); }
    function interrupt() { destination.current = null; schedule(); }
    function pointerInterrupt() { setInstant(false); interrupt(); }
    function historyInterrupt() { setInstant(true); interrupt(); }
    function key(event: KeyboardEvent) { if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(event.key)) { setInstant(true); interrupt(); } }
    const observer = new ResizeObserver(schedule);
    elements.forEach(element => observer.observe(element));
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    window.addEventListener("wheel", pointerInterrupt, { passive: true });
    window.addEventListener("touchstart", pointerInterrupt, { passive: true });
    window.addEventListener("keydown", key);
    window.addEventListener("hashchange", historyInterrupt);
    window.addEventListener("popstate", historyInterrupt);
    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("wheel", pointerInterrupt);
      window.removeEventListener("touchstart", pointerInterrupt);
      window.removeEventListener("keydown", key);
      window.removeEventListener("hashchange", historyInterrupt);
      window.removeEventListener("popstate", historyInterrupt);
    };
  }, []);

  function navigate(event: MouseEvent<HTMLElement>) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = (event.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
    if (!link || !event.currentTarget.contains(link)) return;
    const section = document.getElementById(link.hash.slice(1));
    if (!section) return;
    setInstant(event.detail === 0);
    setActive(section.id);
    destination.current = section.id;
    // Keep native anchor behavior for keyboard, modified clicks, and reduced motion.
    if (event.detail === 0 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    event.preventDefault();
    if (window.location.hash !== link.hash) window.history.pushState(null, "", link.hash);
    // Native scrolling respects scroll margins, retargets repeated clicks, and
    // lets touch or wheel input interrupt the movement without a JS animation loop.
    section.focus({ preventScroll: true });
    section.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return <nav className="admin-settings-nav" aria-label="Settings sections" data-instant={instant || undefined} onPointerDown={() => setInstant(false)} onKeyDown={() => setInstant(true)} onClick={navigate}>
    {sections.map(([id, label]) => <a key={id} href={`#${id}`} aria-current={active === id ? "location" : undefined}>{label}<span className="admin-settings-current-dot" aria-hidden="true" /></a>)}
  </nav>;
}

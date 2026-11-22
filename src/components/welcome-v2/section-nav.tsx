"use client";

import { useEffect, useState, type MouseEvent } from "react";

/** A section, keyed by its heading's id (the section is the heading's parent <section>). */
export type NavSection = { id: string; label: string };

const NAVBAR = 64; // the sticky navbar's height (h-16)

const sectionOf = (id: string) =>
  document.getElementById(id)?.closest("section") ?? null;

/**
 * Floating "you are here" list on the right edge: every section title, with
 * the one crossing the middle of the screen highlighted. The labelled card
 * needs a ~170px gutter beside the max-w-6xl content, which only exists from
 * 2xl; on xl it shrinks to a dots-only rail that opens its labels on hover or
 * keyboard focus. Below xl there is no gutter at all, so it's hidden.
 */
export function SectionNav({ sections }: { sections: NavSection[] }) {
  const [active, setActive] = useState(sections[0]?.id);

  useEffect(() => {
    // A thin band at mid-screen: whichever section crosses it is current.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.getAttribute("aria-labelledby");
          if (entry.isIntersecting && id) setActive(id);
        }
      },
      { rootMargin: "-45% 0px -55% 0px" },
    );
    for (const s of sections) {
      const section = sectionOf(s.id);
      if (section) observer.observe(section);
    }
    return () => observer.disconnect();
  }, [sections]);

  function jump(event: MouseEvent, id: string) {
    const section = sectionOf(id);
    if (!section) return;
    event.preventDefault();
    window.scrollTo({
      top: section.getBoundingClientRect().top + window.scrollY - NAVBAR,
      behavior: "smooth",
    });
  }

  return (
    <nav
      aria-label="Page sections"
      className="group/nav fixed right-4 top-1/2 z-30 hidden -translate-y-1/2 xl:block"
    >
      <ol className="flex flex-col gap-0.5 rounded-2xl border border-line bg-card/90 p-1.5 shadow-md backdrop-blur">
        {sections.map((s) => {
          const on = s.id === active;
          return (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                onClick={(event) => jump(event, s.id)}
                aria-current={on ? "location" : undefined}
                className={`eyebrow flex min-h-8 items-center gap-2.5 rounded-xl px-3 py-2 transition-colors duration-200 ${
                  on ? "bg-accent-soft text-ink" : "text-muted hover:text-ink"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`h-1.5 shrink-0 rounded-full transition-all duration-300 ${on ? "w-4 bg-accent" : "w-1.5 bg-line-strong"}`}
                />
                {/* focus-visible, not focus-within: a clicked link keeps focus and would hold the rail open. */}
                <span className="sr-only group-hover/nav:not-sr-only group-has-[:focus-visible]/nav:not-sr-only 2xl:not-sr-only">
                  {s.label}
                </span>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

"use client";

import { useEffect, useState } from "react";

/**
 * Resolves design tokens to concrete colour strings for canvas/SVG libraries.
 *
 * Recharts writes `fill` and `stroke` as SVG *attributes*, and an SVG
 * attribute cannot hold `var(--token)` — only a CSS property can. So a chart
 * cannot simply be handed the token names the rest of the app uses; the values
 * have to be read off the document.
 *
 * Reading them (rather than duplicating the hex in a chart file) is what keeps
 * the chart on the design system: it re-reads whenever the theme changes, so
 * the same component draws correctly in light and dark without a second
 * palette to maintain.
 *
 * `fallbacks` is returned verbatim on the server and for the first client
 * render, which is what keeps the two in agreement — reading computed styles
 * during render would produce a hydration mismatch.
 */
export function useTokenColors<T extends Record<string, string>>(
  fallbacks: T
): T {
  const [colors, setColors] = useState<T>(fallbacks);

  useEffect(() => {
    const root = document.documentElement;

    function read() {
      const computed = getComputedStyle(root);

      // A functional update rather than a comparison against `colors`: the
      // resolved values are not a dependency of this effect, and listing them
      // as one would tear down and re-subscribe the observer on every theme
      // change. Returning `prev` unchanged is React's own bail-out, so this
      // cannot loop through its own state update.
      setColors((prev) => {
        const next = {} as T;
        let changed = false;

        for (const key of Object.keys(prev) as (keyof T)[]) {
          const value = computed.getPropertyValue(key as string).trim();
          const resolved = (value || prev[key]) as T[keyof T];
          next[key] = resolved;
          if (resolved !== prev[key]) changed = true;
        }

        return changed ? next : prev;
      });
    }

    read();

    // Two ways the theme can move: an explicit [data-theme] toggle, or the OS
    // preference changing under a viewer who never pressed the toggle.
    const observer = new MutationObserver(read);
    observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', read);

    return () => {
      observer.disconnect();
      media.removeEventListener('change', read);
    };
  }, []);

  return colors;
}

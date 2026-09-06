"use client";

import { useSyncExternalStore } from "react";

/**
 * Light/dark switch.
 *
 * The stored value is the OVERRIDE, not the theme: absent means "follow the
 * OS", and only pressing this writes one. That distinction is why the CSS
 * guards its media query with :not([data-theme="light"]) — someone whose OS is
 * dark has to be able to force light and have it stick.
 *
 * The attribute is applied by a blocking inline script in layout.tsx, before
 * first paint. This component only keeps the button's label in sync and writes
 * the choice; if it were responsible for applying the theme, every dark-mode
 * viewer would get a white flash on every navigation.
 *
 * The active theme is genuinely EXTERNAL state — it lives in localStorage and
 * in the OS — so it is read with useSyncExternalStore rather than mirrored
 * into a useState. That gets tab-to-tab sync and correct hydration for free,
 * and keeps the two instances of this button (header and mobile sheet) in
 * agreement without either owning the value.
 */

export const THEME_STORAGE_KEY = "hiatus-theme";

/** Fired on this tab after a change; `storage` only fires on the others. */
const THEME_EVENT = "hiatus:themechange";

type Theme = "light" | "dark";

const DARK_QUERY = "(prefers-color-scheme: dark)";

function subscribe(onChange: () => void) {
  const media = window.matchMedia(DARK_QUERY);
  media.addEventListener("change", onChange);
  window.addEventListener("storage", onChange);
  window.addEventListener(THEME_EVENT, onChange);

  return () => {
    media.removeEventListener("change", onChange);
    window.removeEventListener("storage", onChange);
    window.removeEventListener(THEME_EVENT, onChange);
  };
}

/** Returns a primitive, so useSyncExternalStore's identity check is stable. */
function getSnapshot(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // Private mode / storage disabled. The OS preference still applies.
  }
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

/** The server cannot know the viewer's OS preference, so it does not guess.
 *  React re-renders with the real value straight after hydration. */
function getServerSnapshot(): Theme | null {
  return null;
}

export function ThemeToggle({ variant = "icon" }: { variant?: "icon" | "row" }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Not persisting is survivable; not switching would not be.
    }
    window.dispatchEvent(new Event(THEME_EVENT));
  }

  // Before hydration resolves, the label stays neutral — "Switch to dark
  // theme" would be wrong half the time, and a wrong label is worse than a
  // generic one.
  const label =
    theme === null
      ? "Switch colour theme"
      : theme === "dark"
        ? "Switch to light theme"
        : "Switch to dark theme";

  const icon = theme === "dark" ? <SunIcon /> : <MoonIcon />;

  if (variant === "row") {
    return (
      <button
        type="button"
        onClick={toggle}
        className="ui-caps flex min-h-11 w-full items-center justify-between rounded-md px-3 text-2xs text-ink-soft transition-colors hover:bg-raised hover:text-ink"
      >
        <span>{theme === "dark" ? "Light theme" : "Dark theme"}</span>
        <span aria-hidden="true" className="text-muted">
          {icon}
        </span>
        <span className="sr-only">{label}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className="flex h-10 w-10 items-center justify-center rounded-md text-ink-soft transition-colors hover:bg-raised hover:text-ink"
    >
      {icon}
    </button>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <path d="M20 13.5A8 8 0 0 1 10.5 4a8 8 0 1 0 9.5 9.5z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" strokeLinecap="round" />
    </svg>
  );
}

"use client";

import { createContext, useCallback, useContext, useEffect, useSyncExternalStore, type ReactNode } from "react";

type Theme = "light" | "dark" | "system";
interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
}
const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = "hiatus-theme";
const CHANGE_EVENT = "hiatus:themechange";

let storageFallback: Theme | null = null;

function getStoredTheme(): Theme {
  if (storageFallback) return storageFallback;
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : "system";
  } catch { return "system"; }
}
function subscribeTheme(notify: () => void) {
  window.addEventListener("storage", notify);
  window.addEventListener(CHANGE_EVENT, notify);
  return () => {
    window.removeEventListener("storage", notify);
    window.removeEventListener(CHANGE_EVENT, notify);
  };
}
function subscribeSystem(notify: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
}
const serverTheme = (): Theme => "system";
const systemDark = () => window.matchMedia("(prefers-color-scheme: dark)").matches;
const serverDark = () => false;

export function ThemeProvider({ children }: { children: ReactNode }) {
  // On mount, read the stored theme from localStorage.
  const theme = useSyncExternalStore(subscribeTheme, getStoredTheme, serverTheme);
  const dark = useSyncExternalStore(subscribeSystem, systemDark, serverDark);
  const resolvedTheme = theme === "system" ? dark ? "dark" : "light" : theme;

  // Whenever the theme or system preference changes, resolve and apply.
  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  // Listen for system theme changes when in "system" mode.
  // The external-store subscription keeps browser state separate from rendering.
  const setTheme = useCallback((next: Theme) => {
    try { window.localStorage.setItem(STORAGE_KEY, next); storageFallback = null; } catch { storageFallback = next; }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>{children}</ThemeContext.Provider>;
}
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}

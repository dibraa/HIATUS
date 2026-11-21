"use client";

import { useEffect } from "react";
import toast from "react-hot-toast";

const LIMIT = 5, WINDOW_MS = 10_000;

/**
 * Anti-spam for every button and link on every page: one control accepts at most LIMIT
 * clicks per 10 seconds; faster clicks are swallowed (no React handler, no form
 * submit), each blocked click is reported to /api/rate-limit (a red 429 in
 * DevTools > Network), and a pop-up says how long to wait. Controls that are meant to be
 * clicked rapidly, like quantity steppers, opt out with data-click-limit="off".
 * The backend's 10-second repeat guard still protects the data itself.
 */
export function ClickLimit() {
  useEffect(() => {
    const clicks = new WeakMap<Element, number[]>();
    const guard = (event: MouseEvent) => {
      // Links too: sidebar, navbar and tab-bar items are <a> tags, and each spam click is a page request.
      const button = (event.target as Element | null)?.closest?.("button, a[href], input[type=submit], input[type=button], [role=button]");
      if (!button || button.closest("[data-click-limit=off]")) return;
      const now = Date.now(), recent = (clicks.get(button) ?? []).filter(at => now - at < WINDOW_MS);
      if (recent.length >= LIMIT) {
        // Capture phase on window runs before React's root listeners, so the click never reaches the app.
        event.preventDefault();
        event.stopImmediatePropagation();
        const wait = Math.max(1, Math.ceil((recent[0] + WINDOW_MS - now) / 1000));
        const fallback = `You're clicking too fast. Try again in ${wait} seconds.`;
        // Report the blocked click so it shows in DevTools > Network as a 429; the pop-up uses the server's message.
        void fetch("/api/rate-limit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ retry_after_seconds: wait }) })
          .then(response => response.json() as Promise<{ error?: string }>)
          .then(data => toast.error(data.error || fallback, { id: "click-limit" }))
          .catch(() => toast.error(fallback, { id: "click-limit" }));
      } else recent.push(now);
      clicks.set(button, recent);
    };
    window.addEventListener("click", guard, true);
    return () => window.removeEventListener("click", guard, true);
  }, []);
  return null;
}

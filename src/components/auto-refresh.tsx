"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Keeps the queue current without anyone pressing anything.
 *
 * A polled `router.refresh()` rather than a Supabase realtime subscription.
 * The tradeoff is deliberate: a websocket would be a few seconds fresher, but
 * it also means a second data path with its own auth, its own reconnect
 * behaviour and its own way of being subtly wrong after a laptop lid closes.
 * `router.refresh()` re-runs the Server Component with the session it already
 * has, so there is exactly one way this page gets its data.
 *
 * Two things keep the polling honest:
 *
 *   - It stops while the tab is hidden. A till tablet left on the counter
 *     overnight should not spend the night querying.
 *   - It refreshes immediately on becoming visible again, so the first thing
 *     a returning barista sees is current rather than however stale the last
 *     poll left it.
 */
export function AutoRefresh({ seconds = 15 }: { seconds?: number }) {
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, seconds * 1000);

    function onVisible() {
      if (document.visibilityState === "visible") router.refresh();
    }

    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [router, seconds]);

  return null;
}

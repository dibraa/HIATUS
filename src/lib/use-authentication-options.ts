"use client";

import { useCallback, useEffect, useState } from "react";
import { isAuthenticationOptions, type AuthenticationResult } from "@/lib/authentication-options";

/** Refresh only the optional providers; never reset the person's login form. */
export function useAuthenticationOptions(initial: AuthenticationResult) {
  const [current, setCurrent] = useState<AuthenticationResult>({ ...initial, error: null });
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision(value => value + 1), []);

  useEffect(() => {
    let disposed = false;
    let loading = false;
    const controller = new AbortController();
    async function check() {
      if (loading || document.visibilityState === "hidden") return;
      loading = true;
      try {
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            const response = await fetch("/api/auth/options", {
              cache: "no-store",
              signal: AbortSignal.any([controller.signal, AbortSignal.timeout(12000)]),
            });
            const data: AuthenticationResult = await response.json();
            if (!response.ok || !isAuthenticationOptions(data.options)) throw new Error("Options unavailable");
            if (!disposed) setCurrent({ options: data.options, error: null });
            return;
          } catch {
            if (disposed || controller.signal.aborted) return;
          }
        }
        if (!disposed) setCurrent(previous => ({
          ...previous,
          error: "Additional sign-in options could not load. Retrying automatically. You can still try your email and password.",
        }));
      } finally { loading = false; }
    }

    void check();
    const interval = window.setInterval(check, 15000);
    window.addEventListener("focus", check);
    window.addEventListener("online", check);
    document.addEventListener("visibilitychange", check);
    return () => {
      disposed = true;
      controller.abort();
      window.clearInterval(interval);
      window.removeEventListener("focus", check);
      window.removeEventListener("online", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, [revision]);

  return { ...current, refresh };
}

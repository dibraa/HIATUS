"use client";

import { useCallback, useEffect, useState } from "react";
import { isAuthenticationOptions, type AuthenticationResult } from "@/lib/authentication-options";

/** Refresh only the optional providers; never reset the person's login form. */
export function useAuthenticationOptions(initial: AuthenticationResult) {
  const [current, setCurrent] = useState(initial);
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
        const response = await fetch("/api/auth/options", { cache: "no-store", signal: controller.signal });
        const data: AuthenticationResult = await response.json();
        if (!response.ok || !isAuthenticationOptions(data.options)) throw new Error("Options unavailable");
        if (!disposed) setCurrent({ options: data.options, error: null });
      } catch {
        if (!disposed) setCurrent(previous => ({
          ...previous,
          error: "Additional sign-in options could not load. You can try your email and password, or refresh the sign-in options.",
        }));
      } finally { loading = false; }
    }
    void check();
    const interval = window.setInterval(check, 15000);
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);
    return () => {
      disposed = true;
      controller.abort();
      window.clearInterval(interval);
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, [revision]);

  return { ...current, refresh };
}

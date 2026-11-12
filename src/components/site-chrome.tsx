"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

/** Layouts persist across links: route changes must also update their chrome. */
export function SiteChrome({ children, guest, kind }: {
  children: ReactNode;
  guest?: ReactNode;
  kind: "navigation" | "footer" | "customer-tabs";
}) {
  const pathname = usePathname();
  const router = useRouter();
  const lastPath = useRef<string | null>(null);
  const authPage = pathname === "/login" || pathname === "/signup" || pathname === "/session-unavailable";

  useEffect(() => {
    if (kind !== "navigation" || lastPath.current === pathname) return;
    lastPath.current = pathname;
    // Refresh once on entry, never on every render or failed service request.
    if (authPage) router.refresh();
  }, [pathname, authPage, kind, router]);

  useEffect(() => {
    if (kind !== "navigation") return;
    // A browser-restored document can contain a session that has since expired.
    const restored = (event: PageTransitionEvent) => {
      if (event.persisted) window.location.reload();
    };
    const historyChanged = () => router.refresh();
    window.addEventListener("pageshow", restored);
    window.addEventListener("popstate", historyChanged);
    return () => {
      window.removeEventListener("pageshow", restored);
      window.removeEventListener("popstate", historyChanged);
    };
  }, [kind, router]);

  if (pathname.startsWith("/admin") || pathname.startsWith("/staff")) return null;
  if (kind === "customer-tabs" && authPage) return null;
  return <div className="site-chrome">{kind === "navigation" && authPage ? guest : children}</div>;
}

"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** The root layout persists during navigation, so content width follows the live route. */
export function MainContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const workspace = pathname.startsWith("/admin") || pathname.startsWith("/staff");
  const className = workspace
    ? "w-full flex-1"
    : pathname === "/login" || pathname === "/signup"
      ? "w-full flex-1"
      : pathname === "/menu"
        ? "mx-auto w-full max-w-[1600px] flex-1 px-6 py-8 sm:px-8 sm:py-10 xl:px-10"
        : "mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:py-10";

  return <main id="main" className={className}>{children}</main>;
}

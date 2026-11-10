"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Keep Account free of the shop footer, including client-side navigation. */
export function FooterVisibility({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return pathname === "/profile" ? null : children;
}

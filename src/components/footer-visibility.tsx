"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Keep Account, and the guest welcome at `/` (it ends on its own wordmark
 *  sign-off), free of the shop footer, including client-side navigation.
 *  Signed-in customers still get the footer under their home at `/`. */
export function FooterVisibility({ guest, children }: { guest: boolean; children: ReactNode }) {
  const pathname = usePathname();
  return pathname === "/profile" || (guest && pathname === "/") ? null : children;
}

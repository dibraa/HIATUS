import type { ReactNode } from "react";
import { FormError } from "@/components/ui/field";
// Stays in place for context; FormError adds the app's pop-up (and announces it), so errors such as the 10-second rate limit are never missed.
export function InlineFormError({ children }: { children: ReactNode }) {
  return children ? <><FormError>{children}</FormError><p className="mb-4 break-words rounded-lg border border-danger/40 bg-danger-soft-bg p-3 text-sm text-danger-soft-fg">{children}</p></> : null;
}

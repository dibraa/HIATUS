import type { ReactNode } from "react";
export function InlineFormError({ children }: { children: ReactNode }) {
  return children ? <p role="alert" className="mb-4 break-words rounded-lg border border-danger/40 bg-danger-soft-bg p-3 text-sm text-danger-soft-fg">{children}</p> : null;
}

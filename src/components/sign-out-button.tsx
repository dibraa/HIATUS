"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SignOutButton({ variant = "default" }: { variant?: "default" | "nav" }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const className = variant === "nav"
    ? "ui-caps inline-flex h-10 items-center text-2xs text-ink-soft transition-colors hover:text-ink disabled:opacity-50"
    : "inline-flex min-h-11 items-center whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:bg-card hover:text-ink disabled:opacity-50";

  return (
    <button
      type="button"
      disabled={pending}
      className={className}
      onClick={async () => {
        setPending(true);
        await fetch("/api/auth/signout", { method: "POST" });
        router.push("/");
        router.refresh();
      }}
    >
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}

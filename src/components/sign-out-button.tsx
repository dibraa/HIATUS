"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      disabled={pending}
      className="inline-flex min-h-11 items-center whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-medium text-ink-soft transition-colors duration-150 ease-hi hover:bg-card hover:text-ink disabled:opacity-50"
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

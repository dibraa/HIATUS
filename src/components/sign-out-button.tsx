"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      disabled={pending}
      className="flex min-h-11 w-full items-center rounded-xl px-3 text-left text-sm font-medium text-ink-soft transition-colors duration-150 ease-hi hover:bg-card hover:text-ink disabled:opacity-50"
      onClick={async () => {
        // Guards the double-click: signOut then push then refresh is slow
        // enough on a poor connection to be pressed twice.
        setPending(true);
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/");
        router.refresh();
      }}
    >
      {pending ? "Signing out…" : "Sign out"}
    </button>
  );
}

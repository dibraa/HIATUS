"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn, type AuthState } from "@/app/actions/auth";
import { PasswordField, TextField, FormError } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

const initialState: AuthState = { error: null };

/** Messages for the redirects that land here carrying a reason. */
const NOTICES: Record<string, string> = {
  "link-expired": "That link has expired or was already used. Request a new one.",
  "missing-code": "That link was incomplete. Request a new one.",
};

export function LoginForm() {
  const searchParams = useSearchParams();

  // Empty, not "/", when absent. A blank `next` lets the sign-in action route
  // by role — a barista to the queue, an owner to the dashboard — while an
  // explicit one (set by the auth guard) still resumes the journey the person
  // was already partway through.
  const next = searchParams.get("next") ?? "";
  const notice = NOTICES[searchParams.get("error") ?? ""];

  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />

      {notice && <FormError>{notice}</FormError>}

      <TextField
        id="email"
        name="email"
        label="Email"
        type="email"
        required
        autoComplete="email"
      />

      <PasswordField
        id="password"
        name="password"
        label="Password"
        required
        autoComplete="current-password"
      />

      <Link
        href="/forgot-password"
        className="-mt-1 self-start text-sm font-medium text-accent-ink underline underline-offset-4 transition-colors hover:text-ink"
      >
        Forgot your password?
      </Link>

      {/* Sign-in failures are deliberately not attached to a single field:
          saying which of the two was wrong tells an attacker whether the
          address is registered. */}
      <FormError>{state.error}</FormError>

      <Button type="submit" size="md" disabled={pending} className="mt-1 w-full">
        {pending ? "Signing in…" : "Log in"}
      </Button>
    </form>
  );
}

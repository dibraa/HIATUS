"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn, type AuthState } from "@/app/actions/auth";
import { TextField, FormError } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

const initialState: AuthState = { error: null };

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />

      <TextField
        id="email"
        name="email"
        label="Email"
        type="email"
        required
        autoComplete="email"
      />

      <TextField
        id="password"
        name="password"
        label="Password"
        type="password"
        required
        autoComplete="current-password"
      />

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

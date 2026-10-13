"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn, type AuthState } from "@/app/actions/auth";
import { PasswordField, TextField, FormError } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { TextLink } from "@/components/ui/text-link";

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
        defaultValue={state.email}
      />

      <PasswordField
        id="password"
        name="password"
        label="Password"
        required
        autoComplete="current-password"
      />

      {/* A 44px target with negative margins, so the link takes a 28px slot
          in the stack while still being easy to hit. */}
      <TextLink href="/forgot-password" block className="-my-2 self-start text-sm">
        Forgot your password?
      </TextLink>

      {/* Sign-in failures are deliberately not attached to a single field:
          saying which of the two was wrong tells an attacker whether the
          address is registered. */}
      <FormError>{state.error}</FormError>

      <Button type="submit" size="md" loading={pending} className="mt-1 w-full">
        {pending ? "Signing in…" : "Log in"}
      </Button>
    </form>
  );
}

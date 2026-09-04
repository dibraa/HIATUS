"use client";

import { useActionState } from "react";
import { signUp, type AuthState } from "@/app/actions/auth";
import { TextField, FormError } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

const initialState: AuthState = { error: null };

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signUp, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <TextField
        id="full_name"
        name="full_name"
        label="Full name"
        type="text"
        required
        autoComplete="name"
        hint="What the barista calls out when the order is ready."
      />

      <TextField
        id="email"
        name="email"
        label="Email"
        type="email"
        required
        autoComplete="email"
      />

      {/* Optional, unlike the email — the account is keyed on the address, and
          demanding a phone number to buy a coffee is friction with no payoff.
          It is stored on the profile so the counter can reach someone about an
          order that has gone wrong. */}
      <TextField
        id="phone"
        name="phone"
        label="Phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        hint="Optional. Only used if the shop needs to reach you about an order."
      />

      {/* minLength is echoed in the hint rather than left for the browser to
          reveal on a failed submit — a rule you learn by breaking it is a
          rule stated too late. */}
      <TextField
        id="password"
        name="password"
        label="Password"
        type="password"
        required
        minLength={8}
        autoComplete="new-password"
        hint="At least 8 characters."
      />

      <FormError>{state.error}</FormError>

      <Button type="submit" size="md" disabled={pending} className="mt-1 w-full">
        {pending ? "Creating account…" : "Sign up"}
      </Button>
    </form>
  );
}

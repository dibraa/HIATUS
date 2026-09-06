"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { signUp, type AuthState } from "@/app/actions/auth";
import { PasswordField, TextField, FormError } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

const initialState: AuthState = { error: null };

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signUp, initialState);
  const router = useRouter();

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <TextField
        id="full_name"
        name="full_name"
        label="Full name"
        type="text"
        required
        autoComplete="name"
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
      />

      {/* minLength is echoed in the hint rather than left for the browser to
          reveal on a failed submit — a rule you learn by breaking it is a
          rule stated too late. */}
      <PasswordField
        id="password"
        name="password"
        label="Password"
        required
        minLength={8}
        autoComplete="new-password"
      />

      <FormError>{state.error}</FormError>

      <Button type="submit" size="md" disabled={pending || Boolean(state.success)} className="mt-1 w-full">
        {pending ? "Creating account…" : "Sign up"}
      </Button>

      {state.success && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-scrim px-4"
          role="presentation"
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="signup-success-title"
            className="w-full max-w-sm rounded-2xl border border-line bg-card p-6 text-center shadow-lg"
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success-soft-bg text-xl text-success-soft-fg">
              ✓
            </div>
            <h2 id="signup-success-title" className="mt-4 text-xl font-semibold text-ink">
              Account created
            </h2>
            <p className="mt-2 text-sm text-muted">{state.success}</p>
            <Button
              type="button"
              size="md"
              className="mt-5 w-full"
              onClick={() => router.push("/login")}
            >
              Proceed to login
            </Button>
          </section>
        </div>
      )}
    </form>
  );
}

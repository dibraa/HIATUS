"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TextField, FormError } from "@/components/ui/field";
import { requestPasswordReset } from "@/app/actions/auth";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordReset, {
    error: null,
    sent: false,
  });

  // The success state replaces the form rather than sitting above it. Leaving
  // the form in place invites a second submit, which only burns the rate limit
  // and makes the person wonder whether the first one worked.
  if (state.sent) {
    return (
      <div className="rounded-lg border border-line bg-card p-6 text-center">
        <div
          aria-hidden="true"
          className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success-soft-bg text-success-soft-fg"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M3 7l9 6 9-6" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="3" y="5" width="18" height="14" rx="2" />
          </svg>
        </div>

        <h2 className="mt-4 text-xl font-semibold text-ink">Check your email</h2>
        <p className="mx-auto mt-2 max-w-[42ch] text-sm text-muted">
          If that address has an account with us, a link to set a new password
          is on its way. It expires in an hour.
        </p>

        <Link
          href="/login"
          className="mt-6 inline-block text-sm font-medium text-accent-ink underline underline-offset-4 transition-colors duration-150 ease-hi hover:text-ink"
        >
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <TextField
        id="email"
        name="email"
        type="email"
        label="Email address"
        autoComplete="email"
        required
        placeholder="you@example.com"
        hint="We will send a link to set a new password."
      />

      {state.error && <FormError>{state.error}</FormError>}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Sending…" : "Send reset link"}
      </Button>

      <p className="text-center text-sm text-muted">
        Remembered it?{" "}
        <Link
          href="/login"
          className="font-medium text-accent-ink underline underline-offset-4 transition-colors duration-150 ease-hi hover:text-ink"
        >
          Log in
        </Link>
      </p>
    </form>
  );
}

"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { signUp, type AuthState } from "@/app/actions/auth";
import { PasswordField, TextField, FormError } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { GoogleSignIn } from "@/components/google-sign-in";
import type { getAuthenticationOptions } from "@/lib/authentication-options";
import { useAuthenticationOptions } from "@/lib/use-authentication-options";

const initialState: AuthState = { error: null };
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SignupForm({ authentication }: { authentication: Awaited<ReturnType<typeof getAuthenticationOptions>> }) {
  const { options, error: optionsError, refresh } = useAuthenticationOptions(authentication);
  const [state, formAction, pending] = useActionState(signUp, initialState);
  const [googlePending, setGooglePending] = useState(false);
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const emailError = emailTouched && !EMAIL_PATTERN.test(email.trim())
    ? "Enter a valid email address, such as name@example.com."
    : null;

  return (
    <div className="flex flex-col gap-5">
    {options?.google_enabled && options.google_client_id && <>
      <GoogleSignIn key={options.google_client_id} clientId={options.google_client_id} intent="signup" disabled={pending || Boolean(state.success)} onPendingChange={setGooglePending} />
      <p className="border-t border-line pt-4 text-center text-sm text-muted">Or create an account with email</p>
    </>}
    <FormError>{optionsError}</FormError>
    {optionsError && <Button type="button" variant="outline" onClick={refresh}>Refresh sign-in options</Button>}
    <form action={formAction} className="flex flex-col gap-4">
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
        pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
        title="Enter a valid email address, such as name@example.com."
        autoComplete="email"
        value={email}
        error={emailError}
        onChange={(event) => {
          setEmail(event.target.value);
          setEmailTouched(true);
        }}
        onBlur={() => setEmailTouched(true)}
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
        inputMode="numeric"
        pattern="[0-9]*"
        title="Enter numbers only."
        autoComplete="tel"
        hint="Optional. Only used if something goes wrong with an order."
        value={phone}
        onChange={(event) => setPhone(event.target.value.replace(/\D/g, ""))}
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
        hint="At least 8 characters."
        autoComplete="new-password"
      />

      <FormError>{state.error}</FormError>

      <Button
        type="submit"
        size="md"
        loading={pending}
        disabled={googlePending || Boolean(state.success)}
        className="mt-1 w-full"
      >
        {pending ? "Creating account…" : "Sign up"}
      </Button>

      {/* Entrance is the stylesheet's `.scrim-in` / `.dialog-in` keyframes,
          so there is no visibility state to flip after mount. The one button
          takes focus on open: it is the only thing to do here. */}
      {state.success && (
        <div
          className="scrim-in fixed inset-0 z-50 flex items-center justify-center bg-scrim px-4"
          role="presentation"
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="signup-success-title"
            className="dialog-in w-full max-w-sm rounded-2xl border border-line bg-card p-6 text-center shadow-lg"
          >
            <div
              aria-hidden="true"
              className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success-soft-bg text-success-soft-fg"
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m5 12.5 4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 id="signup-success-title" className="display mt-4 text-2xl text-ink">
              Account created
            </h2>
            <p className="mt-tight text-sm text-muted">{state.success}</p>
            <Button
              type="button"
              size="md"
              autoFocus
              className="mt-stack w-full"
              onClick={() => router.push("/login")}
            >
              Proceed to login
            </Button>
          </section>
        </div>
      )}
    </form>
    </div>
  );
}

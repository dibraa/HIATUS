"use client";

import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn, verifyAdminMfa, type AuthState } from "@/app/actions/auth";
import { PasswordField, TextField, FormError } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { TextLink } from "@/components/ui/text-link";
import { GoogleSignIn } from "@/components/google-sign-in";
import { LoginCaptcha } from "@/components/login-captcha";
import type { getAuthenticationOptions } from "@/lib/authentication-options";
import { useAuthenticationOptions } from "@/lib/use-authentication-options";

const initialState: AuthState = { error: null };

/** Messages for the redirects that land here carrying a reason. */
const NOTICES: Record<string, string> = {
  "link-expired": "That link has expired or was already used. Request a new one.",
  "missing-code": "That link was incomplete. Request a new one.",
};

export function LoginForm({ authentication }: { authentication: Awaited<ReturnType<typeof getAuthenticationOptions>> }) {
  const { options, error: optionsError, refresh } = useAuthenticationOptions(authentication);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);
  const [googlePending, setGooglePending] = useState(false);
  const captchaPolicy = options?.recaptcha_enabled ? options.recaptcha_site_key : null;
  const [previousCaptchaPolicy, setPreviousCaptchaPolicy] = useState(captchaPolicy);
  if (previousCaptchaPolicy !== captchaPolicy) {
    setPreviousCaptchaPolicy(captchaPolicy);
    setCaptchaToken(null);
    setCaptchaReset(value => value + 1);
  }
  const resetCaptcha = () => { setCaptchaToken(null); setCaptchaReset(value => value + 1); };
  const searchParams = useSearchParams();

  // Empty, not "/", when absent. A blank `next` lets the sign-in action route
  // by role — a barista to the queue, an owner to the dashboard — while an
  // explicit one (set by the auth guard) still resumes the journey the person
  // was already partway through.
  const next = searchParams.get("next") ?? "";
  const notice = NOTICES[searchParams.get("error") ?? ""];

  const [state, formAction, pending] = useActionState(async (previous: AuthState, data: FormData) => {
    try {
      const result = await signIn(previous, data);
      if (result.rateLimited) {
        void fetch("/api/rate-limit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source: "server",
            retry_after_seconds: result.rateLimited.retryAfter,
            message: result.rateLimited.message ?? result.error,
          }),
        }).catch(() => {});
      }
      if (result.error) refresh();
      return result;
    }
    finally { resetCaptcha(); }
  }, initialState);

  const [mfaState, mfaAction, mfaPending] = useActionState(async (previous: AuthState, data: FormData) => {
    const result = await verifyAdminMfa(previous, data);
    if (result.rateLimited) {
      void fetch("/api/rate-limit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "server",
          retry_after_seconds: result.rateLimited.retryAfter,
          message: result.rateLimited.message ?? result.error,
        }),
      }).catch(() => {});
    }
    return result;
  }, initialState);
  const [mfaDismissed, setMfaDismissed] = useState(false);
  const activeMfa = !mfaDismissed ? (mfaState.mfa ?? state.mfa) : undefined;

  if (activeMfa) {
    return (
      <form action={mfaAction} className="flex flex-col gap-4">
        <input type="hidden" name="challenge_id" value={activeMfa.challenge_id} />
        <input type="hidden" name="expires_at" value={activeMfa.expires_at} />
        <input type="hidden" name="recipient" value={activeMfa.recipient} />
        <input type="hidden" name="next" value={next} />
        <p className="text-sm text-ink-soft">
          Enter the 6-digit verification code sent to <strong>{activeMfa.recipient || "your email"}</strong>.
        </p>
        <TextField
          id="mfa-code"
          name="code"
          label="6-digit verification code"
          type="text"
          inputMode="numeric"
          pattern="[0-9]{6}"
          maxLength={6}
          required
          autoComplete="one-time-code"
          placeholder="123456"
        />
        <FormError>{mfaState.error}</FormError>
        <Button type="submit" size="md" loading={mfaPending} className="w-full">
          {mfaPending ? "Verifying…" : "Verify and log in"}
        </Button>
        <Button type="button" variant="ghost" size="sm" disabled={mfaPending} onClick={() => setMfaDismissed(true)}>
          Back to login
        </Button>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-5">
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      {options?.recaptcha_enabled && <input type="hidden" name="recaptcha_token" value={captchaToken || ""} />}
      {optionsError && <p role="status" className="text-sm text-muted">{optionsError}</p>}

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

      <Button type="submit" size="md" loading={pending} disabled={googlePending || Boolean(options?.recaptcha_enabled && !captchaToken)} className="mt-1 w-full">
        {pending ? "Signing in…" : "Log in"}
      </Button>

      {/* The verification sits at the bottom of the ticket, below Google, so a
          single box gates both sign-in paths. Say so beside the control it
          enables rather than leaving a disabled button unexplained. */}
      {options?.recaptcha_enabled && !captchaToken && (
        <p className="-mt-2 text-xs text-muted">Complete the verification below to sign in.</p>
      )}
    </form>
    {options?.google_enabled && options.google_client_id && <>
      <p className="border-t border-line pt-4 text-center text-sm text-muted">or</p>
      <GoogleSignIn key={options.google_client_id} clientId={options.google_client_id} intent="login" next={next}
        captchaToken={captchaToken} captchaRequired={options.recaptcha_enabled} disabled={pending} onAttempt={resetCaptcha} onPendingChange={setGooglePending} />
    </>}
    {options?.recaptcha_enabled && options.recaptcha_site_key && (
      <LoginCaptcha siteKey={options.recaptcha_site_key} resetKey={captchaReset} onChange={setCaptchaToken} />
    )}
    </div>
  );
}

"use client";

import { useActionState, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, type AuthState } from "@/app/actions/auth";
import { PasswordField, TextField, FormError } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { TextLink } from "@/components/ui/text-link";
import { GoogleSignIn } from "@/components/google-sign-in";
import { LoginCaptcha } from "@/components/login-captcha";
import type { getAuthenticationOptions } from "@/lib/authentication-options";

const initialState: AuthState = { error: null };

/** Messages for the redirects that land here carrying a reason. */
const NOTICES: Record<string, string> = {
  "link-expired": "That link has expired or was already used. Request a new one.",
  "missing-code": "That link was incomplete. Request a new one.",
};

export function LoginForm({ authentication }: { authentication: Awaited<ReturnType<typeof getAuthenticationOptions>> }) {
  const { options, error: optionsError } = authentication;
  const router = useRouter();
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);
  const [googlePending, setGooglePending] = useState(false);
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
      if (result.error) router.refresh();
      return result;
    }
    finally { resetCaptcha(); }
  }, initialState);

  return (
    <div className="flex flex-col gap-5">
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <input type="hidden" name="recaptcha_token" value={captchaToken || ""} />
      <FormError>{optionsError}</FormError>

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

      {options?.recaptcha_enabled && options.recaptcha_site_key && (
        <LoginCaptcha siteKey={options.recaptcha_site_key} resetKey={captchaReset} onChange={setCaptchaToken} />
      )}

      <Button type="submit" size="md" loading={pending} disabled={googlePending || !options || (options.recaptcha_enabled && !captchaToken)} className="mt-1 w-full">
        {pending ? "Signing in…" : "Log in"}
      </Button>
    </form>
    {options?.google_enabled && options.google_client_id && <>
      <p className="border-t border-line pt-4 text-center text-sm text-muted">Or continue with Google</p>
      <GoogleSignIn clientId={options.google_client_id} intent="login" next={next}
        captchaToken={captchaToken} captchaRequired={options.recaptcha_enabled} disabled={pending} onAttempt={resetCaptcha} onPendingChange={setGooglePending} />
    </>}
    </div>
  );
}

"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { saveAuthenticationSettings } from "@/app/actions/settings";
import type { AuthenticationSettings } from "@/lib/authentication-options";
import { CheckboxField, FormError, FormSuccess } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export function AuthenticationSettingsForm({ settings, error }: { settings: AuthenticationSettings | null; error: string | null }) {
  const [state, action, pending] = useActionState(saveAuthenticationSettings, { error: null, success: null });
  const router = useRouter();
  const source = settings ? `${settings.google_enabled}:${settings.recaptcha_enabled}` : "unavailable";
  const [draft, setDraft] = useState({ source, google: settings?.google_enabled ?? false, captcha: settings?.recaptcha_enabled ?? false });
  useEffect(() => {
    if (state.success) router.refresh();
  }, [router, state.success]);

  if (draft.source !== source) {
    setDraft({ source, google: settings?.google_enabled ?? false, captcha: settings?.recaptcha_enabled ?? false });
  }
  return (
    <form action={action} className="admin-settings-card">
      <h2 className="display text-xl text-ink">Sign-in and security</h2>
      <p className="mt-1.5 max-w-[60ch] text-sm text-muted">Choose how people log in across the site. Turning both options off keeps email-and-password login available without Google or reCAPTCHA. Save to apply changes; current sessions stay active.</p>
      <div className="mt-5 flex flex-col gap-4">
        <FormError>{error}</FormError>
        {settings && <fieldset disabled={pending} className="flex min-w-0 flex-col gap-4">
          <CheckboxField id="google-enabled" name="google_enabled" label="Enable Google sign-in"
            checked={draft.google} onChange={event => setDraft(previous => ({ ...previous, google: event.target.checked }))}
            disabled={!settings.google_ready && !draft.google}
            hint={settings.google_ready ? "Available on login and sign-up. Existing members confirm their password once to connect Google." : "Google sign-in is disabled by server configuration."} />
          <CheckboxField id="recaptcha-enabled" name="recaptcha_enabled" label="Enable reCAPTCHA on login"
            checked={draft.captcha} onChange={event => setDraft(previous => ({ ...previous, captcha: event.target.checked }))}
            disabled={!settings.recaptcha_ready && !draft.captcha}
            hint={settings.recaptcha_ready ? "Requires a checkbox for password and Google login. Sign-up and password recovery stay unchanged." : "reCAPTCHA keys and allowed hostnames are not configured. Add them on the server before enabling."} />
        </fieldset>}
        <FormError>{state.error}</FormError>
        <FormSuccess>{state.success}</FormSuccess>
      </div>
      <Button type="submit" className="mt-5" disabled={!settings || pending} loading={pending}>{pending ? "Saving…" : "Save sign-in settings"}</Button>
    </form>
  );
}

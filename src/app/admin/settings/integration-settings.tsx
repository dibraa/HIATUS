"use client";
import { withPermission } from "@/components/permission-controls";
import { useActionState, useState } from "react";
import { saveIntegrationSettings } from "@/app/actions/settings";
import { Button } from "@/components/ui/button";
import { CheckboxField, FormError, FormSuccess } from "@/components/ui/field";
import type { IntegrationSettings } from "@/lib/integrations";

function IntegrationSettingsFormContent({ settings }: { settings: IntegrationSettings | null }) {
  const [state, action, pending] = useActionState(saveIntegrationSettings, { error: null, success: null });
  const [draft, setDraft] = useState(settings);
  const controls = [
    ["report_export_enabled", "Enable report exports", "CSV, PDF, and Excel downloads. On-screen reports remain available when off."],
    ["push_enabled", "Enable browser push notifications", "Order alerts and test messages. In-app notifications remain available when off."],
    ["password_email_enabled", "Enable password setup and reset email", "Turning off blocks recovery and account setup emails. Existing passwords still work."],
    ["resend_enabled", "Enable Resend", "Select Resend below to send email through its API."],
    ["cloudinary_enabled", "Enable Cloudinary", "Store new menu photos in Cloudinary. Existing photos stay available when off."],
    ["onesignal_enabled", "Enable OneSignal", "Select OneSignal below for order push notifications."],
    ["posthog_enabled", "Enable PostHog", "Anonymous menu, cart and checkout events. No session recording."],
    ["sentry_enabled", "Enable Sentry", "Application errors with sanitized source locations. No form contents or replay."],
  ] as const;
  return <form action={action} className="admin-settings-card" aria-busy={pending}>
    <h3 className="text-lg font-semibold">Services and exports</h3>
    <div className="my-5 flex flex-col gap-4">
      {!draft ? <FormError>API controls could not load. Reload this page to try again.</FormError> : controls.map(([key, label, hint]) => <CheckboxField key={key} id={key} name={key} label={label} hint={hint} checked={draft[key]} disabled={pending} onChange={event => setDraft(previous => previous && ({ ...previous, [key]: event.target.checked }))} />)}
      {draft && <div className="grid gap-4 sm:grid-cols-2">{([['email_provider', 'Email provider', [['smtp', 'SMTP'], ['resend', 'Resend']]], ['push_provider', 'Push provider', [['native', 'Browser push'], ['onesignal', 'OneSignal']]]] as const).map(([key, label, choices]) => <label key={key} className="flex min-w-0 flex-col gap-2 text-sm font-medium" htmlFor={key}>{label}<select id={key} name={key} value={draft[key]} disabled={pending} onChange={event => setDraft(previous => previous && ({ ...previous, [key]: event.target.value }))} className="min-h-11 rounded-md border border-line-strong bg-card px-3 text-ink">{choices.map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></label>)}</div>}
      <FormError>{state.error}</FormError><FormSuccess>{state.success}</FormSuccess>
    </div>
    <Button type="submit" disabled={!draft || pending} loading={pending}>Save API controls</Button>
  </form>;
}

export const IntegrationSettingsForm = withPermission("settings.integrations", IntegrationSettingsFormContent, true);

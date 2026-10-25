"use client";
import { useActionState, useState } from "react";
import { saveIntegrationSettings } from "@/app/actions/settings";
import { Button } from "@/components/ui/button";
import { CheckboxField, FormError, FormSuccess } from "@/components/ui/field";
import type { IntegrationSettings } from "@/lib/integrations";

export function IntegrationSettingsForm({ settings }: { settings: IntegrationSettings | null }) {
  const [state, action, pending] = useActionState(saveIntegrationSettings, { error: null, success: null });
  const [draft, setDraft] = useState(settings);
  const controls = [
    ["report_export_enabled", "Enable report exports", "CSV, PDF, and Excel downloads. On-screen reports remain available when off."],
    ["push_enabled", "Enable browser push notifications", "Order alerts and test messages. In-app notifications remain available when off."],
    ["password_email_enabled", "Enable password setup and reset email", "Turning off blocks recovery and account setup emails. Existing passwords still work."],
  ] as const;
  return <form action={action} className="admin-settings-card" aria-busy={pending}>
    <h3 className="text-lg font-semibold">Exports and notifications</h3>
    <div className="my-5 flex flex-col gap-4">
      {!draft ? <FormError>API controls could not load. Reload this page to try again.</FormError> : controls.map(([key, label, hint]) => <CheckboxField key={key} id={key} name={key} label={label} hint={hint} checked={draft[key]} disabled={pending} onChange={event => setDraft(previous => previous && ({ ...previous, [key]: event.target.checked }))} />)}
      <FormError>{state.error}</FormError><FormSuccess>{state.success}</FormSuccess>
    </div>
    <Button type="submit" disabled={!draft || pending} loading={pending}>Save API controls</Button>
  </form>;
}

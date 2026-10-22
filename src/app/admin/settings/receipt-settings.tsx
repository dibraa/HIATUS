"use client";
import { useActionState, useState } from "react";
import { saveReceiptSettings } from "@/app/actions/settings";
import { CheckboxField, FormError, FormSuccess } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export function ReceiptSettingsForm({ enabled }: { enabled: boolean | null }) {
  const [checked, setChecked] = useState(enabled ?? false);
  const [state, action, pending] = useActionState(saveReceiptSettings, { error: null, success: null });
  return <form action={action} className="admin-panel" aria-busy={pending}>
    <h2 className="text-lg font-semibold">Email receipts</h2>
    <p className="my-4 text-sm text-muted">Send customers a receipt email after payment. Turning this off stops receipt emails; printed receipts remain available.</p>
    {enabled === null ? <p role="alert">Receipt settings could not load. Reload this page to try again.</p> : <>
      <CheckboxField id="receipt-enabled" name="enabled" label="Send email receipts" checked={checked} onChange={event => setChecked(event.target.checked)} disabled={pending} />
      <div className="mt-4" aria-live="polite"><FormError>{state.error}</FormError><FormSuccess>{state.success}</FormSuccess></div>
      <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save receipt settings"}</Button>
    </>}
  </form>;
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { readCredentialSettings, saveCredentialSettings } from "@/app/actions/credentials";
import type { CredentialProvider, CredentialStatus } from "@/lib/credential-settings";

const fields: Record<CredentialProvider, { key: string; label: string; secret?: boolean; hint?: string }[]> = {
  google: [{ key: "client_id", label: "Google client ID", hint: "Use a Web application client ID. Configure your website origins in Google Cloud." }],
  smtp: [{ key: "host", label: "SMTP host" }, { key: "port", label: "SMTP port", hint: "465 for TLS, or 587 for STARTTLS." }, { key: "user", label: "SMTP username" }, { key: "password", label: "SMTP password", secret: true }, { key: "from", label: "Sender email" }],
  recaptcha: [{ key: "site_key", label: "reCAPTCHA site key" }, { key: "secret_key", label: "reCAPTCHA secret key", secret: true }, { key: "hostnames", label: "Allowed hostnames", hint: "Comma-separated hostnames, such as localhost, cafe.example.com. No URLs or ports." }],
};
const labels: Record<CredentialProvider, string> = { google: "Google sign-in", smtp: "Email (SMTP)", recaptcha: "reCAPTCHA" };
const names = Object.keys(fields) as CredentialProvider[];
function initialDrafts(data: CredentialStatus | null) {
  return Object.fromEntries(names.map(name => [name, Object.fromEntries(fields[name].map(field => [field.key, field.secret ? "" : data?.providers[name].values[field.key] || ""]))])) as Record<CredentialProvider, Record<string, string>>;
}

export function CustomCredentials({ initial }: { initial: CredentialStatus | null }) {
  const [data, setData] = useState(initial);
  const [drafts, setDrafts] = useState(() => initialDrafts(initial));
  const [expanded, setExpanded] = useState<CredentialProvider | null>(null);
  const [reset, setReset] = useState<CredentialProvider | null>(null);
  const [error, setError] = useState<string | null>(initial ? null : "Credential settings could not load. Try again.");
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  function refresh() {
    setError(null); setSuccess(null);
    start(async () => {
      const result = await readCredentialSettings();
      if (!result.data) setError(result.error);
      else { setData(result.data); if (!data) setDrafts(initialDrafts(result.data)); setSuccess("Configuration refreshed. Your draft values are retained."); }
    });
  }
  function save(name: CredentialProvider, action: "save" | "reset") {
    if (!data) return;
    setReset(null); setError(null); setSuccess(null);
    start(async () => {
      const result = await saveCredentialSettings(name, action, data.revision, drafts[name]);
      // Never retain submitted passwords in browser state after a request.
      setDrafts(previous => ({ ...previous, [name]: { ...previous[name], ...Object.fromEntries(fields[name].filter(field => field.secret).map(field => [field.key, ""])) } }));
      if (!result.data) { setError(result.error); return; }
      setData(result.data);
      setDrafts(previous => ({ ...previous, [name]: initialDrafts(result.data)[name] }));
      setSuccess(action === "reset" ? `${labels[name]} now uses the original configuration.` : `${labels[name]} custom configuration saved. Changes apply immediately; provider switches are unchanged.`);
      router.refresh();
    });
  }
  return <section className="admin-settings-card" aria-labelledby="custom-credentials-heading">
    <div className="flex flex-wrap items-center justify-between gap-3"><h3 id="custom-credentials-heading" className="text-xl font-semibold">Custom credentials</h3><Button variant="ghost" disabled={pending} onClick={refresh}>Refresh configuration</Button></div>
    <p className="mt-2 text-sm text-muted">Original credentials stay unchanged. Blank secret fields keep saved custom values.</p>
    {error && <p role="alert" className="mt-4 text-sm text-danger">{error}</p>}
    {success && <p role="status" className="mt-4 text-sm text-success">{success}</p>}
    {data && <div className="mt-5 divide-y divide-line">{names.map(name => {
      const status = data.providers[name], open = expanded === name;
      return <div key={name} className="min-w-0 py-4">
        <button type="button" aria-expanded={open} aria-controls={`credentials-${name}`} disabled={pending} onClick={() => setExpanded(open ? null : name)} className="flex min-h-11 w-full flex-wrap items-center justify-between gap-2 text-left text-ink">
          <span className="font-semibold">{labels[name]}</span><span className="text-sm text-muted">{status.source === "custom" ? "Custom configuration" : "Original configuration"}{!status.configured && " · Not configured"} · {open ? "Close" : "Edit"}</span>
        </button>
        {open && <form id={`credentials-${name}`} onSubmit={event => { event.preventDefault(); save(name, "save"); }} className="mt-4 flex min-w-0 flex-col gap-4">
          <fieldset disabled={pending} className="grid min-w-0 gap-4 sm:grid-cols-2">{fields[name].map(field => <div key={field.key} className="min-w-0"><TextField id={`custom-${name}-${field.key}`} label={field.label} type={field.secret ? "password" : field.key === "from" ? "email" : "text"} autoComplete="off" spellCheck={false} maxLength={4096} required={!field.secret || status.source !== "custom" || !status.secrets[field.key]} value={drafts[name][field.key]} hint={field.secret ? status.source === "custom" && status.secrets[field.key] ? "Custom secret saved. Leave blank to keep it." : "Enter a custom secret. Original secrets are never copied." : field.hint} onChange={event => setDrafts(previous => ({ ...previous, [name]: { ...previous[name], [field.key]: event.target.value } }))} /></div>)}</fieldset>
          <p className="text-xs text-muted">Saving checks format only. Verify the provider setup before relying on these credentials.</p>
          <div className="flex flex-wrap gap-3"><Button type="submit" disabled={pending} loading={pending}>Save custom configuration</Button>{status.source === "custom" && <Button variant="outline" disabled={pending} onClick={() => setReset(name)}>Use original configuration</Button>}</div>
        </form>}
      </div>;
    })}</div>}
    <Modal className="admin-report-dialog" open={reset !== null} title="Use original configuration?" body={`Remove saved custom ${reset ? labels[reset] : ""} credentials? The original configuration will apply immediately. Provider switches stay unchanged.`} confirmLabel="Use original configuration" onCancel={() => setReset(null)} onConfirm={() => { if (reset) save(reset, "reset"); }} />
  </section>;
}

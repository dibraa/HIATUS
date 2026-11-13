"use client";
import { withPermission } from "@/components/permission-controls";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { readCredentialSettings, saveCredentialSettings, requestCredentialOtp, verifyCredentialOtp, unlockCredentialSettings, lockCredentialSettings } from "@/app/actions/credentials";
import type { CredentialProvider, CredentialStatus, CredentialOtp, CredentialAccess, LockedCredentialStatus, UnlockedCredentialStatus } from "@/lib/credential-settings";
import { CredentialOtpDialog } from "./credential-otp-dialog";

const fields: Record<CredentialProvider, { key: string; label: string; secret?: boolean; hint?: string; optional?: boolean }[]> = {
  cloudinary: [{ key: "cloud_name", label: "Cloud name" }, { key: "api_key", label: "API key", secret: true }, { key: "api_secret", label: "API secret", secret: true }],
  onesignal: [{ key: "app_id", label: "App ID" }, { key: "api_key", label: "App API key", secret: true }],
  posthog: [{ key: "project_key", label: "Project key", secret: true }, { key: "host", label: "Ingestion host", hint: "https://us.i.posthog.com or https://eu.i.posthog.com" }],
  sentry: [{ key: "dsn", label: "DSN", secret: true }],
  native_push: [{ key: "public_key", label: "VAPID public key" }, { key: "private_key", label: "VAPID private key", secret: true }, { key: "subject", label: "Contact", hint: "A mailto: email address or HTTPS contact URL." }],
  google: [{ key: "client_id", label: "Google client ID", hint: "Use a Web application client ID. Configure your website origins in Google Cloud." }],
  smtp: [{ key: "host", label: "SMTP host" }, { key: "port", label: "SMTP port" }, { key: "user", label: "SMTP username" }, { key: "password", label: "SMTP password", secret: true }, { key: "from", label: "Sender email", optional: true, hint: "Optional when the SMTP username is an email address." }],
  recaptcha: [{ key: "site_key", label: "reCAPTCHA site key" }, { key: "secret_key", label: "reCAPTCHA secret key", secret: true }, { key: "hostnames", label: "Allowed hostnames", hint: "Comma-separated hostnames, such as localhost, cafe.example.com. No URLs or ports." }],
};
const labels: Record<CredentialProvider, string> = { google: "Google sign-in", smtp: "Email (SMTP)", recaptcha: "reCAPTCHA", cloudinary: "Cloudinary", onesignal: "OneSignal", posthog: "PostHog", sentry: "Sentry", native_push: "Browser push (VAPID)" };
const names: CredentialProvider[] = ["google", "smtp", "recaptcha", "cloudinary", "onesignal", "posthog", "sentry", "native_push"];

function draftsFor(data?: UnlockedCredentialStatus) {
  return Object.fromEntries(names.map(name => [name, Object.fromEntries(fields[name].map(field => [field.key, field.secret ? "" : data?.providers[name]?.values[field.key] || ""]))])) as Record<CredentialProvider, Record<string, string>>;
}
function summaryOf(data: CredentialStatus): LockedCredentialStatus {
  return { locked: true, providers: Object.fromEntries(names.map(name => [name, { source: data.providers[name]?.source ?? "original", configured: data.providers[name]?.configured ?? false }])) as LockedCredentialStatus["providers"] };
}
function CustomCredentialsContent({ initial }: { initial: CredentialStatus | null }) {
  const [summary, setSummary] = useState(() => initial ? summaryOf(initial) : null);
  const [access, setAccess] = useState<CredentialAccess | null>(null);
  const accessRef = useRef<string | null>(null);
  const [drafts, setDrafts] = useState(() => draftsFor());
  const [seconds, setSeconds] = useState(0);
  const [expanded, setExpanded] = useState<CredentialProvider | null>(null);
  const [rotation, setRotation] = useState<"save" | "reset" | null>(null);
  const [reset, setReset] = useState<CredentialProvider | null>(null);
  const [verification, setVerification] = useState<{ challenge: CredentialOtp; stage: "otp" | "pin" } | null>(null);
  const [error, setError] = useState<string | null>(initial ? null : "Credential settings could not load. Try unlocking again.");
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const clearAccess = useCallback(() => {
    const token = accessRef.current;
    accessRef.current = null;
    setAccess(null); setSuccess(null); setError(null); setDrafts(draftsFor()); setExpanded(null); setReset(null); setRotation(null); setVerification(null);
    if (token) void lockCredentialSettings(token);
  }, []);
  useEffect(() => {
    const restore = (event: PageTransitionEvent) => { if (event.persisted) clearAccess(); };
    window.addEventListener("pagehide", clearAccess); window.addEventListener("pageshow", restore);
    return () => {
      window.removeEventListener("pagehide", clearAccess); window.removeEventListener("pageshow", restore);
      if (accessRef.current) void lockCredentialSettings(accessRef.current);
      accessRef.current = null;
    };
  }, [clearAccess]);
  useEffect(() => {
    if (!access) return;
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((Date.parse(access.settings.expires_at) - Date.now()) / 1000));
      if (!remaining) clearAccess();
      setSeconds(remaining);
    }, 1000);
    return () => clearInterval(timer);
  }, [access, clearAccess]);
  function refresh() {
    setError(null); setSuccess(null);
    start(async () => {
      const result = await readCredentialSettings(access?.access_token);
      if (!result.data) { clearAccess(); setError(result.error); return; }
      setSummary(summaryOf(result.data));
      if (result.data.locked) clearAccess();
      else if (access) setAccess({ ...access, settings: result.data });
    });
  }
  function beginUnlock() {
    setError(null); setSuccess(null);
    start(async () => {
      const result = await requestCredentialOtp();
      if (!result.data) { setError(result.error); return; }
      setVerification({ challenge: result.data, stage: "otp" });
    });
  }
  function confirm(code: string) {
    if (!verification) return;
    setError(null);
    start(async () => {
      if (verification.stage === "otp") {
        const checked = await verifyCredentialOtp(verification.challenge.challenge_id, code);
        if (!checked.verified) { setError(checked.error); return; }
        setVerification({ ...verification, stage: "pin" }); return;
      }
      const result = await unlockCredentialSettings(verification.challenge.challenge_id, code);
      if (!result.data) { setError(result.error); return; }
      accessRef.current = result.data.access_token;
      setAccess(result.data); setSummary(summaryOf(result.data.settings)); setDrafts(draftsFor(result.data.settings));
      setSeconds(Math.max(0, Math.ceil((Date.parse(result.data.settings.expires_at) - Date.now()) / 1000)));
      setVerification(null); setSuccess("Credentials unlocked for one change.");
    });
  }
  function save(name: CredentialProvider, action: "save" | "reset", confirmed = false) {
    if (!access) return;
    if (name === "native_push" && !confirmed && (action === "reset" || drafts.native_push.public_key !== access.settings.providers.native_push.values.public_key)) { setReset(null); setRotation(action); return; }
    setRotation(null); setReset(null); setError(null); setSuccess(null);
    start(async () => {
      const result = await saveCredentialSettings(name, action, access.settings.revision, action === "reset" ? {} : drafts[name], access.access_token);
      clearAccess();
      if (!result.data) { setError(result.error); return; }
      setSummary(summaryOf(result.data));
      setSuccess(action === "reset" ? "Original configuration restored. Credentials locked." : "Custom configuration saved. Credentials locked.");
      router.refresh();
    });
  }
  const locked = !access;
  return <section className="admin-settings-card" aria-labelledby="custom-credentials-heading">
    <div className="flex flex-wrap items-center justify-between gap-3"><h3 id="custom-credentials-heading" className="text-xl font-semibold">Custom credentials</h3><Button variant="ghost" disabled={pending} onClick={refresh}>Refresh configuration</Button></div>
    <div className="my-5 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted">{locked ? "Locked. Verify your email and security PIN to edit." : `Unlocked for one change. Locks in ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}.`}</p>
      <Button variant={locked ? "primary" : "outline"} disabled={pending} loading={pending && !verification} onClick={locked ? beginUnlock : clearAccess}>{locked ? "Unlock credentials" : "Lock credentials"}</Button>
    </div>
    {error && <p role="alert" className="mt-4 text-sm text-danger">{error}</p>}
    {success && <p role="status" className="mt-4 text-sm text-success">{success}</p>}
    <div className="mt-5 divide-y divide-line">{names.map(name => {
      const status = access?.settings.providers[name], info = summary?.providers[name], open = !locked && expanded === name;
      return <div key={name} className="min-w-0 py-4">
        <button type="button" aria-expanded={open} aria-controls={open ? `credentials-${name}` : undefined} disabled={pending || locked} onClick={() => setExpanded(open ? null : name)} className="flex min-h-11 w-full flex-wrap items-center justify-between gap-2 text-left text-ink disabled:cursor-not-allowed disabled:text-muted">
          <span className="font-semibold">{labels[name]}</span><span className="text-sm text-muted">{locked ? "Locked" : info?.source === "custom" ? "Custom configuration" : "Original configuration"}{!locked && !info?.configured && " / Not configured"}{!locked && (open ? " / Close" : " / Edit")}</span>
        </button>
        {open && status && <form id={`credentials-${name}`} onSubmit={event => { event.preventDefault(); save(name, "save"); }} className="mt-4 flex min-w-0 flex-col gap-4">
          <fieldset disabled={pending} className="grid min-w-0 gap-4 sm:grid-cols-2">{fields[name].map(field => <div key={field.key} className="min-w-0"><TextField id={`custom-${name}-${field.key}`} label={field.label} type={field.secret ? "password" : field.key === "from" ? "email" : "text"} autoComplete="off" spellCheck={false} maxLength={4096} required={!field.optional && (!field.secret || status.source !== "custom" || !status.secrets[field.key])} value={drafts[name][field.key]} hint={field.secret ? status.source === "custom" && status.secrets[field.key] ? "Saved. Leave blank to keep it." : "Enter a custom secret." : field.hint} onChange={event => setDrafts(previous => ({ ...previous, [name]: { ...previous[name], [field.key]: event.target.value } }))} /></div>)}</fieldset>
          <div className="flex flex-wrap gap-3"><Button type="submit" disabled={pending} loading={pending}>Save custom configuration</Button>{status.source === "custom" && <Button variant="outline" disabled={pending} onClick={() => setReset(name)}>Use original configuration</Button>}</div>
        </form>}
      </div>;
    })}</div>
    {verification && <CredentialOtpDialog key={`${verification.challenge.challenge_id}:${verification.stage}`} stage={verification.stage} challenge={verification.challenge} pending={pending} error={error} onConfirm={confirm} onResend={beginUnlock} onCancel={() => { if (!pending) { setVerification(null); setError(null); } }} />}
    <Modal className="admin-report-dialog" open={rotation !== null} title="Change browser push keys?" body="Existing devices may need to reconnect notifications after this change. Your notification preferences stay saved." confirmLabel="Change keys and lock" onCancel={() => setRotation(null)} onConfirm={() => { if (rotation) save("native_push", rotation, true); }} />
    <Modal className="admin-report-dialog" open={reset !== null} title="Use original configuration?" body={`Restore original ${reset ? labels[reset] : ""} credentials? The section will lock after this change.`} confirmLabel="Restore and lock" onCancel={() => setReset(null)} onConfirm={() => { if (reset) save(reset, "reset"); }} />
  </section>;
}
export const CustomCredentials = withPermission("settings.integrations", CustomCredentialsContent, true);

"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import type { CredentialOtp } from "@/lib/credential-settings";

export function CredentialOtpDialog({ challenge, stage = "otp", pending, error, onConfirm, onResend, onCancel }: {
  challenge: CredentialOtp; stage?: "otp" | "pin"; pending: boolean; error: string | null;
  onConfirm: (code: string) => void; onResend: () => void; onCancel: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const isPin = stage === "pin";
  const [code, setCode] = useState("");
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement as HTMLElement | null;
    element?.showModal();
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => { clearInterval(timer); element?.close(); previous?.focus(); };
  }, []);
  const seconds = Math.max(0, Math.ceil((Date.parse(challenge.resend_at) - now) / 1000));
  const remaining = Math.max(0, Math.ceil((Date.parse(challenge.expires_at) - now) / 1000));
  return <dialog ref={dialog} tabIndex={-1} onKeyDown={event => {
    if (event.key !== "Tab") return;
    const controls = [...event.currentTarget.querySelectorAll<HTMLElement>("input:not([disabled]), button:not([disabled])")];
    const first = controls[0], last = controls.at(-1);
    if (!first) { event.preventDefault(); event.currentTarget.focus(); }
    else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }} aria-labelledby="credential-otp-title" aria-describedby="credential-otp-description" aria-busy={pending} onCancel={event => { event.preventDefault(); if (!pending) onCancel(); }} className="m-auto max-h-[calc(100dvh_-_2rem)] w-[calc(100%_-_2rem)] max-w-md overflow-y-auto rounded-xl border border-line bg-card p-6 text-ink shadow-xl backdrop:bg-scrim">
    <h3 id="credential-otp-title" className="text-xl font-semibold">{isPin ? "Enter security PIN" : "Unlock custom credentials"}</h3>
    <p id="credential-otp-description" className="mt-2 break-words text-sm text-muted">{isPin ? "Enter the PIN configured for credential changes on the server." : `Enter the code sent to ${challenge.recipient}.`}</p>
    <form className="mt-5 flex flex-col gap-4" onSubmit={event => { event.preventDefault(); if (!pending && remaining > 0) { onConfirm(code); if (isPin) setCode(""); } }}>
      <TextField id={isPin ? "credential-security-pin" : "credential-otp-code"} label={isPin ? "Security PIN" : "Verification code"} type={isPin ? "password" : "text"} autoFocus autoComplete={isPin ? "off" : "one-time-code"} inputMode="numeric" pattern={isPin ? "[0-9]{6,12}" : "[0-9]{6}"} maxLength={isPin ? 12 : 6} required value={code} disabled={pending} onChange={event => setCode(event.target.value.replace(/\D/g, "").slice(0, isPin ? 12 : 6))} />
      <p className="text-sm text-muted">{remaining > 0 ? `Expires in ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}` : isPin ? "Verification expired. Cancel and unlock credentials again." : "Verification expired. Request a new code."}</p>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" loading={pending} disabled={pending || (isPin ? code.length < 6 || code.length > 12 : code.length !== 6) || remaining === 0}>{isPin ? "Unlock credentials" : "Verify email code"}</Button>
        <Button type="button" variant="outline" disabled={pending} onClick={onCancel}>Cancel</Button>
      </div>
      {!isPin && <Button type="button" variant="ghost" disabled={pending || seconds > 0} onClick={onResend}>{seconds > 0 ? `Resend code in ${seconds}s` : "Resend code"}</Button>}
    </form>
  </dialog>;
}
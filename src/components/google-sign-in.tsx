"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { beginGoogleAuthentication, signInWithGoogle } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { FormError, PasswordField } from "@/components/ui/field";
import { TextLink } from "@/components/ui/text-link";
import { unstable_rethrow } from "next/navigation";

const UNAVAILABLE = "Google sign-in is unavailable. Please try again.";

export function GoogleSignIn({ clientId, intent, next, captchaToken, captchaRequired = false, disabled = false, onAttempt, onPendingChange }: {
  clientId: string; intent: "login" | "signup"; next?: string;
  captchaToken?: string | null; captchaRequired?: boolean; disabled?: boolean; onAttempt?: () => void;
  onPendingChange?: (pending: boolean) => void;
}) {
  const [nonce, setNonce] = useState<string>();
  const [error, setError] = useState<string>();
  const [code, setCode] = useState<string>();
  const [credential, setCredential] = useState<string>();
  const [linkPassword, setLinkPassword] = useState("");
  const [transitionPending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const [generation, setGeneration] = useState(0);
  const [scriptFailed, setScriptFailed] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);
  const nonceRef = useRef<string>(undefined);
  const previousNonce = useRef<string>(undefined);
  const submitLock = useRef(false);
  const mounted = useRef(true);
  const scriptRetries = useRef(0);
  const scriptTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pending = transitionPending || busy;
  const blocked = disabled || pending || (captchaRequired && !captchaToken);

  const restart = useCallback((keepError = false) => {
    previousNonce.current = nonceRef.current;
    nonceRef.current = undefined;
    setNonce(undefined);
    setCredential(undefined);
    setLinkPassword("");
    setCode(undefined);
    if (!keepError) setError(undefined);
    setScriptFailed(false);
    setGeneration(value => value + 1);
  }, []);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; clearTimeout(scriptTimer.current); };
  }, []);

  useEffect(() => {
    let current = true;
    let attempts = 0;
    let loading = false;
    let timer: ReturnType<typeof setTimeout>;
    async function prepare() {
      if (!current || loading) return;
      loading = true;
      attempts++;
      try {
        const result = await beginGoogleAuthentication(intent, previousNonce.current);
        if (!current) return;
        if (!result?.nonce) throw new Error(UNAVAILABLE);
        nonceRef.current = result.nonce;
        previousNonce.current = undefined;
        setNonce(result.nonce);
      } catch {
        if (!current) return;
        if (attempts < 3) timer = setTimeout(() => { void prepare(); }, attempts * 1000);
        else setError(UNAVAILABLE);
      } finally { loading = false; }
    }
    const recover = () => {
      if (!nonceRef.current && !loading && attempts >= 3) { attempts = 0; void prepare(); }
    };
    void prepare();
    window.addEventListener("online", recover);
    window.addEventListener("focus", recover);
    return () => { current = false; clearTimeout(timer); window.removeEventListener("online", recover); window.removeEventListener("focus", recover); };
  }, [intent, generation]);

  useEffect(() => {
    if (!nonce || pending || credential || code === "LOGIN_REQUIRED") return;
    const timer = setTimeout(() => restart(true), 9 * 60 * 1000);
    return () => clearTimeout(timer);
  }, [nonce, pending, credential, code, restart]);

  useEffect(() => {
    if (!scriptFailed) return;
    const recover = () => { if (!submitLock.current) { scriptRetries.current = 0; restart(true); } };
    window.addEventListener("online", recover);
    return () => window.removeEventListener("online", recover);
  }, [scriptFailed, restart]);

  useEffect(() => { if (code === "LINK_REQUIRED") passwordRef.current?.focus(); }, [code]);
  useEffect(() => { onPendingChange?.(pending); return () => onPendingChange?.(false); }, [pending, onPendingChange]);

  async function submit(token: string, password?: string) {
    if (!nonce || blocked || submitLock.current) return;
    submitLock.current = true;
    setBusy(true);
    setError(undefined);
    try {
      // FormData keeps credentials out of Next's development action-argument traces.
      const data = new FormData();
      data.set("credential", token); data.set("nonce", nonce);
      data.set("password", password || ""); data.set("recaptcha_token", captchaToken || ""); data.set("next", next || "");
      const result = await signInWithGoogle(data);
      if (!mounted.current) return;
      if (!result || typeof result.error !== "string") throw new Error(UNAVAILABLE);
      setError(result.code === "LINK_REQUIRED" && !password ? undefined : result.error);
      if (result.code === "CHALLENGE_EXPIRED" || result.code === "GOOGLE_INVALID") restart(true);
      else if (result.code === "LINK_REQUIRED") { setCode(result.code); setCredential(token); }
      else if (!(credential && result.code !== "LOGIN_REQUIRED")) { setCode(result.code); setCredential(undefined); }
    } catch (failure) {
      unstable_rethrow(failure);
      if (mounted.current) setError(UNAVAILABLE);
    } finally {
      submitLock.current = false;
      if (mounted.current) { onAttempt?.(); setBusy(false); }
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-3" aria-busy={pending}>
      {credential && code === "LINK_REQUIRED" ? (
        <form action={async data => { await submit(credential, String(data.get("link_password") || "")); }} className="flex flex-col gap-3">
          <p className="text-sm text-ink-soft">Confirm your current Hiatus password once to connect your Google account.</p>
          <PasswordField id="link-password" name="link_password" label="Current password" autoComplete="current-password" required ref={passwordRef} value={linkPassword} onChange={event => setLinkPassword(event.target.value)} />
          <FormError>{error}</FormError>
          <Button type="submit" loading={pending} disabled={blocked}>Link Google and log in</Button>
          <Button type="button" variant="secondary" disabled={pending} onClick={() => restart()}>Use another Google account</Button>
        </form>
      ) : nonce && !scriptFailed && code !== "LOGIN_REQUIRED" ? (
        <GoogleOAuthProvider key={generation} clientId={clientId} onScriptLoadError={() => {
          setScriptFailed(true);
          setError(UNAVAILABLE);
          if (scriptRetries.current < 2) {
            scriptRetries.current++;
            scriptTimer.current = setTimeout(() => { if (mounted.current) restart(true); }, scriptRetries.current * 1000);
          }
        }}>
          <div inert={blocked} aria-disabled={blocked} className={blocked ? "opacity-50" : ""}>
            <GoogleLogin key={nonce} nonce={nonce} text={intent === "signup" ? "signup_with" : "signin_with"}
              shape="rectangular" size="large" theme="outline" auto_select={false} useOneTap={false}
              onSuccess={response => {
                if (response.credential) startTransition(async () => { await submit(response.credential!); });
                else setError("Google did not return a credential. Please try again.");
              }}
              onError={() => setError("Google sign-in was canceled or could not finish. Please try again.")}
            />
          </div>
        </GoogleOAuthProvider>
      ) : !nonce && code !== "LOGIN_REQUIRED" ? <p role="status" className="text-sm text-muted">Preparing Google sign-in…</p> : null}
      {pending && <p role="status" className="text-sm text-muted">Signing in with Google…</p>}
      {!(credential && code === "LINK_REQUIRED") && <FormError>{error && (/try again/i.test(error) ? error : `${error} Please try again.`)}</FormError>}
      {code === "LOGIN_REQUIRED" && <TextLink href="/login">Go to login</TextLink>}
    </div>
  );
}

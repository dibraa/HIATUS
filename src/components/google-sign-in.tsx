"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { beginGoogleAuthentication, signInWithGoogle } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { FormError, PasswordField } from "@/components/ui/field";
import { TextLink } from "@/components/ui/text-link";
import { useRouter } from "next/navigation";

export function GoogleSignIn({ clientId, intent, next, captchaToken, captchaRequired = false, disabled = false, onAttempt, onPendingChange }: {
  clientId: string; intent: "login" | "signup"; next?: string;
  captchaToken?: string | null; captchaRequired?: boolean; disabled?: boolean; onAttempt?: () => void;
  onPendingChange?: (pending: boolean) => void;
}) {
  const [nonce, setNonce] = useState<string>();
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [code, setCode] = useState<string>();
  const [credential, setCredential] = useState<string>();
  const [transitionPending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);
  const pending = transitionPending || busy;
  const [generation, setGeneration] = useState(0);
  const [scriptFailed, setScriptFailed] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);
  const blocked = disabled || pending || (captchaRequired && !captchaToken);

  useEffect(() => {
    let current = true;
    beginGoogleAuthentication(intent).then(result => {
      if (!current) return;
      setNonce(result.nonce);
      setError(result.error);
    }).catch(() => { if (current) setError("Google sign-in is unavailable. Please try again."); });
    return () => { current = false; };
  }, [intent, generation]);

  useEffect(() => {
    if (code === "LINK_REQUIRED") passwordRef.current?.focus();
  }, [code]);
  useEffect(() => {
    onPendingChange?.(pending);
    return () => onPendingChange?.(false);
  }, [pending, onPendingChange]);

  function restart() {
    setNonce(undefined);
    setCredential(undefined);
    setCode(undefined);
    setError(undefined);
    setScriptFailed(false);
    setGeneration(value => value + 1);
  }

  async function submit(token: string, password?: string) {
    if (!nonce || blocked) return;
    setBusy(true);
    setError(undefined);
      try {
        // FormData also keeps credentials out of Next's development action-argument traces.
        const data = new FormData();
        data.set("credential", token); data.set("nonce", nonce);
        data.set("password", password || ""); data.set("recaptcha_token", captchaToken || ""); data.set("next", next || "");
        const result = await signInWithGoogle(data);
        setError(result.code === "LINK_REQUIRED" && !password ? undefined : result.error);
        setCode(result.code);
        router.refresh();
        if (result.code === "LINK_REQUIRED") setCredential(token);
        else setCredential(undefined);
      } finally {
        onAttempt?.();
        setBusy(false);
      }
  }

  return (
    <div className="flex min-w-0 flex-col gap-3" aria-busy={pending}>
      {credential && code === "LINK_REQUIRED" ? (
        <form action={async data => { await submit(credential, String(data.get("link_password") || "")); }} className="flex flex-col gap-3">
          <p className="text-sm text-ink-soft">Confirm your current Hiatus password once to connect your Google account.</p>
          <PasswordField id="link-password" name="link_password" label="Current password" autoComplete="current-password" required ref={passwordRef} />
          <FormError>{error}</FormError>
          <Button type="submit" loading={pending} disabled={blocked}>Link Google and log in</Button>
          <Button type="button" variant="secondary" disabled={pending} onClick={restart}>Use another Google account</Button>
        </form>
      ) : nonce && !scriptFailed && code !== "LOGIN_REQUIRED" && code !== "CHALLENGE_EXPIRED" ? (
        <GoogleOAuthProvider key={generation} clientId={clientId} onScriptLoadError={() => {
          setScriptFailed(true);
          setError("Google could not load. Check your connection, then try again.");
        }}>
          <div inert={blocked} aria-disabled={blocked} className={blocked ? "opacity-50" : ""}>
            <GoogleLogin nonce={nonce} text={intent === "signup" ? "signup_with" : "signin_with"}
              shape="rectangular" size="large" theme="outline" auto_select={false} useOneTap={false}
              onSuccess={response => {
                if (response.credential) startTransition(async () => { await submit(response.credential!); });
                else setError("Google did not return a credential. Please try again.");
              }}
              onError={() => setError("Google sign-in was canceled or could not finish. Please try again.")}
            />
          </div>
        </GoogleOAuthProvider>
      ) : !error ? <p role="status" className="text-sm text-muted">Preparing Google sign-in…</p> : null}
      {captchaRequired && !captchaToken && <p className="text-sm text-muted">Complete the reCAPTCHA checkbox above to continue with Google.</p>}
      {pending && <p role="status" className="text-sm text-muted">Signing in with Google…</p>}
      {!(credential && code === "LINK_REQUIRED") && <FormError>{error}</FormError>}
      {code === "LOGIN_REQUIRED" ? <TextLink href="/login">Go to login</TextLink> :
        error && !credential && <Button type="button" variant="secondary" disabled={pending} onClick={restart}>Retry Google sign-in</Button>}
    </div>
  );
}

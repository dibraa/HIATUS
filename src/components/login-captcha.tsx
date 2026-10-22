"use client";

import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import { ReCAPTCHA } from "react-google-recaptcha";
import { FormError } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { useResolvedTheme } from "@/components/theme-toggle";
import { loadRecaptcha, type RecaptchaApi } from "@/lib/recaptcha-loader";

const CONFIGURATION_ERROR = "Verification could not start. Retry verification. If it keeps failing, ask the shop to check its reCAPTCHA key and allowed domain.";

class CaptchaBoundary extends Component<{ children: ReactNode; retry: () => void; invalidate: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.invalidate(); }
  render() {
    return this.state.failed ? <><FormError>{CONFIGURATION_ERROR}</FormError><Button type="button" variant="outline" onClick={this.props.retry}>Retry verification</Button></> : this.props.children;
  }
}

function CaptchaInstance({ siteKey, size, theme, onChange, retry }: {
  siteKey: string; size: "compact" | "normal"; theme: "light" | "dark";
  onChange: (token: string | null) => void; retry: () => void;
}) {
  const [api, setApi] = useState<RecaptchaApi | null>(null);
  const [error, setError] = useState<string>();
  const widget = useRef<ReCAPTCHA>(null);
  const active = useRef(true);

  useEffect(() => {
    let current = true;
    active.current = true;
    onChange(null);
    loadRecaptcha().then(loaded => { if (current) setApi(loaded); })
      .catch((cause: Error) => { if (current) setError(cause.message); });
    return () => { current = false; active.current = false; };
  }, [onChange]);

  useEffect(() => {
    const instance = widget.current;
    return () => {
      // Retire an old widget when its size/theme changes; late callbacks must
      // never re-enable the form with an old widget's token.
      try { instance?.reset(); } catch { /* The provider may already have removed its frame. */ }
    };
  }, [api]);

  return <div className="flex min-w-0 flex-col gap-2" aria-busy={!api && !error}>
    {!api && !error && <p role="status" className="text-center text-sm text-muted">Loading verification…</p>}
    {api && <div className="flex w-full justify-center">
      <ReCAPTCHA ref={widget} grecaptcha={api} sitekey={siteKey} size={size} theme={theme}
        onChange={token => { if (active.current) { setError(undefined); onChange(token); } }}
        onExpired={() => { if (active.current) { onChange(null); setError("Verification expired. Complete the checkbox again."); } }}
        onErrored={() => { if (active.current) { onChange(null); setError("Verification could not finish. Retry verification. If it keeps failing, contact the shop."); } }}
      />
    </div>}
    <FormError>{error}</FormError>
    {error && <Button type="button" variant="outline" onClick={retry}>Retry verification</Button>}
  </div>;
}

export function LoginCaptcha({ siteKey, resetKey, onChange }: {
  siteKey: string; resetKey: number; onChange: (token: string | null) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [compact, setCompact] = useState<boolean | null>(null);
  const [attempt, setAttempt] = useState(0);
  // The widget's light/dark frame is baked in when it renders, so it follows
  // the same external theme source as the toggle. null only before hydration,
  // which the key keeps stable so the widget is not rebuilt mid-hydration.
  const theme = useResolvedTheme();
  const resolvedTheme = theme ?? "light";
  useEffect(() => {
    if (!container.current) return;
    // Measure before mounting the widget, avoiding a compact-to-normal
    // remount while Google's initial script is still loading.
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width > 0) setCompact(entry.contentRect.width < 304);
    });
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  function retry() { onChange(null); setAttempt(value => value + 1); }
  return (
    <div ref={container} className="flex min-w-0 flex-col gap-2">
      {/* Google's widget is a fixed-width box inside an iframe, so the only
          thing we can compose is its placement. Centring it keeps the 304px
          box from hugging the left edge of the ~380px ticket column. */}
      {compact !== null && <CaptchaBoundary key={`${siteKey}:${resolvedTheme}:${compact}:${resetKey}:${attempt}`} retry={retry} invalidate={() => onChange(null)}>
        <CaptchaInstance siteKey={siteKey} size={compact ? "compact" : "normal"} theme={resolvedTheme} onChange={onChange} retry={retry} />
      </CaptchaBoundary>}
    </div>
  );
}

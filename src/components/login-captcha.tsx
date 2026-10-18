"use client";

import { useEffect, useRef, useState } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { FormError } from "@/components/ui/field";
import { useResolvedTheme } from "@/components/theme-toggle";

export function LoginCaptcha({ siteKey, resetKey, onChange }: {
  siteKey: string; resetKey: number; onChange: (token: string | null) => void;
}) {
  const widget = useRef<ReCAPTCHA>(null);
  const container = useRef<HTMLDivElement>(null);
  const [compact, setCompact] = useState(true);
  const [error, setError] = useState<string>();
  // The widget's light/dark frame is baked in when it renders, so it follows
  // the same external theme source as the toggle. null only before hydration,
  // which the key keeps stable so the widget is not rebuilt mid-hydration.
  const theme = useResolvedTheme();
  const resolvedTheme = theme ?? "light";
  useEffect(() => {
    widget.current?.reset();
  }, [resetKey]);
  useEffect(() => {
    if (!container.current) return;
    let previous = true;
    const observer = new ResizeObserver(([entry]) => {
      const next = entry.contentRect.width < 304;
      if (next !== previous) { onChange(null); setCompact(next); previous = next; }
    });
    observer.observe(container.current);
    return () => observer.disconnect();
  }, [onChange]);
  return (
    <div ref={container} className="flex min-w-0 flex-col gap-2">
      {/* Google's widget is a fixed-width box inside an iframe, so the only
          thing we can compose is its placement. Centring it keeps the 304px
          box from hugging the left edge of the ~380px ticket column. */}
      <div className="flex w-full justify-center">
        <ReCAPTCHA key={`${resolvedTheme}-${compact ? "compact" : "normal"}`} ref={widget} sitekey={siteKey} size={compact ? "compact" : "normal"} theme={resolvedTheme}
          asyncScriptOnLoad={() => {
            if (widget.current?.getWidgetId() == null) {
              onChange(null);
              setError("reCAPTCHA could not load. Check your connection or reload this page.");
            }
          }}
          onChange={token => { setError(undefined); onChange(token); }}
          onExpired={() => { onChange(null); setError("reCAPTCHA expired. Complete the checkbox again."); }}
          onErrored={() => { onChange(null); setError("reCAPTCHA could not load. Check your connection or reload this page."); }}
        />
      </div>
      <FormError>{error}</FormError>
    </div>
  );
}

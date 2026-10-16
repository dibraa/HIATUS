"use client";

import { useEffect, useRef, useState } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { FormError } from "@/components/ui/field";

export function LoginCaptcha({ siteKey, resetKey, onChange }: {
  siteKey: string; resetKey: number; onChange: (token: string | null) => void;
}) {
  const widget = useRef<ReCAPTCHA>(null);
  const container = useRef<HTMLDivElement>(null);
  const [compact, setCompact] = useState(true);
  const [error, setError] = useState<string>();
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
      <ReCAPTCHA key={compact ? "compact" : "normal"} ref={widget} sitekey={siteKey} size={compact ? "compact" : "normal"}
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
      <FormError>{error}</FormError>
    </div>
  );
}

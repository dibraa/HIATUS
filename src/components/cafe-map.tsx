"use client";
import { useEffect, useState } from "react";
import { currentIntegrations } from "@/lib/integration-client";
export function CafeMap() {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    const update = () => setUrl(currentIntegrations()?.maps_url ?? null);
    update(); window.addEventListener("hiatus:integrations", update);
    return () => window.removeEventListener("hiatus:integrations", update);
  }, []);
  return url ? <iframe title="Hiatus Coffee location" src={url} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen className="mt-4 h-64 w-full min-w-[200px] rounded-lg border-0" /> : null;
}

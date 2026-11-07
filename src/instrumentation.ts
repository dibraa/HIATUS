export async function onRequestError(error: unknown) {
  // Send source locations only: no request, message, headers, cookies or action arguments.
  try {
    const name = error instanceof Error ? error.name : "Error";
    const frames = error instanceof Error ? String(error.stack || "").split("\n").slice(1, 9).flatMap(line => {
      const match = line.match(/(?:.*[/\\])([^/\\():?#]+\.(?:js|cjs|mjs|ts|tsx)):(\d+):(\d+)\)?$/);
      return match ? [{ filename: match[1].replace(/[^a-zA-Z0-9_.-]/g, ""), lineno: Number(match[2]), colno: Number(match[3]) }] : [];
    }) : [];
    const { apiFetch } = await import("@/lib/api-client");
    await apiFetch("/integrations/errors", { method: "POST", body: JSON.stringify({ name, frames, source: "next" }), signal: AbortSignal.timeout(3000) });
  } catch { /* Monitoring cannot change the original failure. */ }
}

// Answers a click the browser has already blocked (components/click-limit.tsx) or a
// rate-limited server action so the 429 is visible in DevTools > Network.
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    retry_after_seconds?: unknown;
    source?: unknown;
    message?: unknown;
  };
  const maxRetry = body.source === "server" ? 3600 : 10;
  const retry = Math.min(maxRetry, Math.max(1, Math.ceil(Number(body.retry_after_seconds)) || 10));
  const customMessage = typeof body.message === "string" ? body.message.trim().slice(0, 200) : "";
  return Response.json(
    {
      error: customMessage || `You're clicking too fast. Try again in ${retry} seconds.`,
      code: "RATE_LIMITED",
      retry_after_seconds: retry,
    },
    { status: 429, headers: { "Retry-After": String(retry), "Cache-Control": "no-store" } },
  );
}

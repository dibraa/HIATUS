// Answers a click the browser has already blocked (components/click-limit.tsx), so the
// block is visible in DevTools > Network as a 429. It never reaches the backend.
export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { retry_after_seconds?: unknown };
  const retry = Math.min(10, Math.max(1, Math.ceil(Number(body.retry_after_seconds)) || 10));
  return Response.json(
    { error: `You're clicking too fast. Try again in ${retry} seconds.`, code: "RATE_LIMITED", retry_after_seconds: retry },
    { status: 429, headers: { "Retry-After": String(retry), "Cache-Control": "no-store" } },
  );
}

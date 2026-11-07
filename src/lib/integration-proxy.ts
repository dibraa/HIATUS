import { apiFetch } from "@/lib/api-client";
import { getServerToken } from "@/lib/server-token";
const headers = { "Cache-Control": "no-store" };
export async function forwardIntegration(request: Request, operation: string) {
  const origin = request.headers.get("origin");
  if (origin !== new URL(request.url).origin) return Response.json({ error: "Invalid request origin." }, { status: 403, headers });
  if (!["events", "errors", "push-test"].includes(operation)) return Response.json({ error: "Not found." }, { status: 404, headers });
  if (Number(request.headers.get("content-length")) > 8192) return Response.json({ error: "Request too large." }, { status: 413, headers });
  try {
    const body = await request.text();
    if (body.length > 8192) return Response.json({ error: "Request too large." }, { status: 413, headers });
    JSON.parse(body);
    const result = await apiFetch("/integrations/" + operation, { method: "POST", token: operation === "push-test" ? (await getServerToken()) ?? undefined : undefined, body, cache: "no-store" });
    return Response.json(await result.json(), { status: result.status, headers });
  } catch { return Response.json({ error: "Provider request unavailable." }, { status: 503, headers }); }
}

import { getServerToken } from "@/lib/server-token";
import { apiFetch } from "@/lib/api-client";

export const dynamic = "force-dynamic";

// Menu edit turns (server/src/services/menu-edit-turns.js). The edit dialog checks in here every few
// seconds; the token lives in an httpOnly cookie, so the browser cannot call the API directly.
// The item id travels in the body to keep this route static and its URL stable.
async function forward(request: Request, method: "POST" | "DELETE") {
  const origin = request.headers.get("origin");
  if (origin !== new URL(request.url).origin) {
    return Response.json({ error: "Invalid request origin." }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }
  const token = await getServerToken();
  if (!token) return Response.json({ error: "Sign in as an administrator to edit the menu." }, { status: 401 });
  const { id, ...body } = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  if (typeof id !== "string" || !/^[a-f0-9]{24}$/.test(id)) return Response.json({ error: "Not found" }, { status: 404 });
  try {
    // Always a JSON body: the API refuses body-less writes, DELETE included.
    const response = await apiFetch(`/menu/${id}/lock`, { method, token, body: JSON.stringify(body), cache: "no-store", signal: AbortSignal.timeout(15000) });
    return new Response(await response.text(), { status: response.status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Editing turns are unavailable. Try again." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}

export const POST = (request: Request) => forward(request, "POST");
export const DELETE = (request: Request) => forward(request, "DELETE");

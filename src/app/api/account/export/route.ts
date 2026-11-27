import { getServerToken } from "@/lib/server-token";
import { apiFetch } from "@/lib/api-client";

export const dynamic = "force-dynamic";

export async function GET() {
  const token = await getServerToken();
  if (!token) return Response.json({ error: "Sign in to export your data." }, { status: 401 });
  try {
    const response = await apiFetch("/account/export", { token, cache: "no-store" });
    const text = await response.text();
    if (!response.ok) {
      return new Response(text, { status: response.status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
    }
    return new Response(text, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": 'attachment; filename="hiatus-my-data.json"',
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return Response.json({ error: "Unable to export your data right now." }, { status: 503 });
  }
}

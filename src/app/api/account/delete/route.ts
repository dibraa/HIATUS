import { cookies } from "next/headers";
import { getServerToken } from "@/lib/server-token";
import { apiFetch } from "@/lib/api-client";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin !== new URL(request.url).origin) {
    return Response.json({ error: "Invalid request origin." }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }
  const token = await getServerToken();
  if (!token) return Response.json({ error: "Sign in to delete your account." }, { status: 401 });
  const body = await request.text();
  try {
    const response = await apiFetch("/account", { method: "DELETE", token, body: body || "{}", cache: "no-store" });
    const text = await response.text();
    if (response.ok) {
      const store = await cookies();
      store.delete("token");
    }
    return new Response(text, { status: response.status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Account deletion is unavailable right now." }, { status: 503 });
  }
}

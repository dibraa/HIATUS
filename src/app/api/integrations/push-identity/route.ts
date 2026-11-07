import { apiJson } from "@/lib/api-client";
import { getServerToken } from "@/lib/server-token";
export async function GET() {
  const token = await getServerToken();
  if (!token) return Response.json({ error: "Sign in to enable notifications." }, { status: 401 });
  try { return Response.json(await apiJson("/integrations/push-identity", { token, cache: "no-store" }), { headers: { "Cache-Control": "no-store" } }); }
  catch { return Response.json({ error: "Push notifications unavailable." }, { status: 409, headers: { "Cache-Control": "no-store" } }); }
}

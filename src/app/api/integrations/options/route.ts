import { apiJson } from "@/lib/api-client";
export async function GET() {
  try { return Response.json(await apiJson("/integrations/options", { cache: "no-store" }), { headers: { "Cache-Control": "no-store" } }); }
  catch { return Response.json({ error: "Integration settings unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } }); }
}

import { getServerToken } from "@/lib/server-token";
import { apiFetch } from "@/lib/api-client";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const token = await getServerToken();
  if (!token) return Response.json({ error: "Sign in as an administrator to export reports." }, { status: 401 });
  const input = new URL(request.url).searchParams;
  const query = new URLSearchParams();
  for (const key of ["view", "period", "date", "search", "kind", "method", "status", "format", "order"]) if (input.has(key)) query.set(key, input.get(key)!);
  try {
    const response = await apiFetch(`/admin/finance/export?${query}`, { token, cache: "no-store", signal: AbortSignal.timeout(60000) });
    if (!response.ok) return Response.json(await response.json(), { status: response.status, headers: { "Cache-Control": "no-store" } });
    return new Response(response.body, { headers: {
      "Content-Type": response.headers.get("Content-Type") || "application/octet-stream",
      "Content-Disposition": response.headers.get("Content-Disposition") || 'attachment; filename="hiatus-report.xlsx"',
      "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff",
    } });
  } catch { return Response.json({ error: "Export could not finish. Please try again." }, { status: 503 }); }
}

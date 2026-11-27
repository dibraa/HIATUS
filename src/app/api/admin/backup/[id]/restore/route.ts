import { getCurrentUser } from "@/lib/auth";
import { getServerToken } from "@/lib/server-token";
import { apiJson } from "@/lib/api-client";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const origin = request.headers.get("origin");
  if (origin !== new URL(request.url).origin) {
    return Response.json({ error: "Invalid request origin." }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }
  const user = await getCurrentUser();
  if (user?.role !== "admin" || !user.permissions.includes("settings.restore")) {
    return Response.json({ error: "Restore permission required." }, { status: 403 });
  }
  const token = await getServerToken();
  if (!token) return Response.json({ error: "Sign in again." }, { status: 401 });
  const { id } = await params;
  const credentialAccess = request.headers.get("x-credential-access");

  try {
    return Response.json(await apiJson(`/admin/backup/${encodeURIComponent(id)}/restore`, {
      method: "POST",
      token,
      headers: credentialAccess ? { "x-credential-access": credentialAccess } : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(300000),
    }));
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Restore could not be completed." }, { status: 503 });
  }
}

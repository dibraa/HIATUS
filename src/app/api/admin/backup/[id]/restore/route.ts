import { getCurrentUser } from "@/lib/auth";
import { getServerToken } from "@/lib/server-token";
import { apiJson } from "@/lib/api-client";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (user?.role !== "admin") return Response.json({ error: "Admin access required." }, { status: 403 });
  const token = await getServerToken();
  if (!token) return Response.json({ error: "Sign in again." }, { status: 401 });
  const { id } = await params;

  try {
    return Response.json(await apiJson(`/admin/backup/${encodeURIComponent(id)}/restore`, {
      method: "POST",
      token,
      cache: "no-store",
      signal: AbortSignal.timeout(300000),
    }));
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Restore could not be completed." }, { status: 503 });
  }
}

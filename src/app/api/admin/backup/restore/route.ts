import { getCurrentUser } from "@/lib/auth";
import { getServerToken } from "@/lib/server-token";
import { apiFetch } from "@/lib/api-client";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (user?.role !== "admin") return Response.json({ error: "Admin access required." }, { status: 403 });
  const token = await getServerToken();
  if (!token) return Response.json({ error: "Sign in again." }, { status: 401 });

  try {
    const response = await apiFetch("/admin/backup/restore", {
      method: "POST",
      token,
      body: await request.formData(),
      cache: "no-store",
      signal: AbortSignal.timeout(300000),
    });
    const data = await response.json().catch(() => ({ error: "Restore could not be completed." }));
    return Response.json(data, { status: response.status });
  } catch {
    return Response.json({ error: "Restore could not be completed." }, { status: 503 });
  }
}

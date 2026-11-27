import { getCurrentUser } from "@/lib/auth";
import { getServerToken } from "@/lib/server-token";
import { apiFetch } from "@/lib/api-client";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
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
  const maxBytes = 512 * 1024 * 1024;
  if (Number(request.headers.get("content-length")) > maxBytes) {
    return Response.json({ error: "Backup file must be 512 MB or smaller." }, { status: 413 });
  }

  try {
    const formData = await request.formData();
    const uploaded = formData.get("backup");
    if (uploaded && typeof uploaded !== "string" && uploaded.size > maxBytes) {
      return Response.json({ error: "Backup file must be 512 MB or smaller." }, { status: 413 });
    }
    const credentialAccess = request.headers.get("x-credential-access");
    const response = await apiFetch("/admin/backup/restore", {
      method: "POST",
      token,
      headers: credentialAccess ? { "x-credential-access": credentialAccess } : undefined,
      body: formData,
      cache: "no-store",
      signal: AbortSignal.timeout(300000),
    });
    const data = await response.json().catch(() => ({ error: "Restore could not be completed." }));
    return Response.json(data, { status: response.status });
  } catch {
    return Response.json({ error: "Restore could not be completed." }, { status: 503 });
  }
}

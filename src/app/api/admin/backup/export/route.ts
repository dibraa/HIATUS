import { getCurrentUser } from "@/lib/auth";
import { getServerToken } from "@/lib/server-token";
import { apiJson } from "@/lib/api-client";

export const dynamic = "force-dynamic";

async function adminRequest() {
  const user = await getCurrentUser();
  if (user?.role !== "admin") throw Object.assign(new Error("Admin access required."), { status: 403 });
  const token = await getServerToken();
  if (!token) throw Object.assign(new Error("Sign in again."), { status: 401 });
  return { token };
}

export async function GET() {
  try {
    const { token } = await adminRequest();
    return Response.json(await apiJson<{
      backups: unknown[];
      logs: unknown[];
      automatic: { enabled: boolean; intervalHours: number; retention: number };
    }>("/admin/backup", { token, cache: "no-store" }));
  } catch (error) {
    const status = (error as { status?: number }).status || 503;
    return Response.json({ error: error instanceof Error ? error.message : "Backup list could not be loaded." }, { status });
  }
}

export async function POST() {
  try {
    const { token } = await adminRequest();
    return Response.json(await apiJson("/admin/backup/create", { method: "POST", token, cache: "no-store" }));
  } catch (error) {
    const status = (error as { status?: number }).status || 503;
    return Response.json({ error: error instanceof Error ? error.message : "Backup could not be created." }, { status });
  }
}

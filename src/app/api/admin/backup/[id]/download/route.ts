import { getCurrentUser } from "@/lib/auth";
import { getServerToken } from "@/lib/server-token";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (user?.role !== "admin") return Response.json({ error: "Admin access required." }, { status: 403 });
  const token = await getServerToken();
  if (!token) return Response.json({ error: "Sign in again." }, { status: 401 });
  const { id } = await params;

  try {
    const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
    const response = await fetch(`${base}/admin/backup/${encodeURIComponent(id)}/download`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(120000),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({ error: "Backup could not be downloaded." }));
      return Response.json(data, { status: response.status });
    }
    return new Response(response.body, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": response.headers.get("Content-Disposition") || 'attachment; filename="hiatus-backup.zip"',
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return Response.json({ error: "Backup could not be downloaded." }, { status: 503 });
  }
}

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { apiFetch } from "@/lib/api-client";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Invalid request origin." }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }
  const store = await cookies();
  const token = store.get("token")?.value;
  if (token) {
    await apiFetch("/auth/signout", { method: "POST", token, body: JSON.stringify({}), cache: "no-store" }).catch(() => {});
  }
  store.delete("token");
  return NextResponse.json({ ok: true });
}

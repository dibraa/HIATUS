import { NextResponse } from "next/server";
import { getServerToken } from "@/lib/server-token";
import { apiJson } from "@/lib/api-client";
import type { OrderNotification } from "@/types/database";

export const dynamic = "force-dynamic";

export async function GET() {
  const token = await getServerToken();
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const notifications = await apiJson<OrderNotification[]>("/account/notification-feed", {
      token,
    });
    return NextResponse.json(notifications, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ error: "Couldn't load notifications" }, { status: 502 });
  }
}

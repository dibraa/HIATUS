"use server";
import { revalidatePath } from "next/cache";
import { apiJson } from "@/lib/api-client";
import { getServerToken } from "@/lib/server-token";
import type { Closeout, CloseoutInput } from "@/lib/reconciliation";
export async function readCloseout(date: string): Promise<{ data?: Closeout; error?: string }> {
  try { return { data: await apiJson<Closeout>(`/admin/finance/reconciliation/${encodeURIComponent(date)}`, { token: (await getServerToken()) ?? undefined, cache: "no-store" }) }; }
  catch (error) { return { error: (error as Error).message }; }
}
export async function saveCloseout(date: string, input: CloseoutInput): Promise<{ data?: Closeout; error?: string }> {
  try {
    const data = await apiJson<Closeout>(`/admin/finance/reconciliation/${encodeURIComponent(date)}`, { token: (await getServerToken()) ?? undefined, method: "POST", body: JSON.stringify(input) });
    revalidatePath("/admin/reports");revalidatePath("/admin/activity");
    return { data };
  } catch (error) { return { error: (error as Error).message }; }
}

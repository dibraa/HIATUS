"use server";
import { apiJson } from "@/lib/api-client";
import { getServerToken } from "@/lib/server-token";
import { revalidatePath } from "next/cache";

function refreshFinance() {
  for (const path of ["/admin/reports", "/admin/orders", "/admin", "/staff", "/staff/pos", "/admin/activity", "/orders"]) revalidatePath(path);
}
async function mutate(path: string, body: object) {
  try {
    await apiJson(`/admin/finance${path}`, { method: "POST", token: (await getServerToken()) ?? undefined, body: JSON.stringify(body) });
    refreshFinance(); return { error: null };
  } catch (error) { return { error: (error as Error).message }; }
}
export async function createDispute(order: string, issue: string) { return mutate("/disputes", { order, issue }); }
export async function updateDispute(caseId: string, version: number, kind: string, note: string, outcome?: string) { return mutate(`/disputes/${encodeURIComponent(caseId)}/events`, { version, kind, note, outcome }); }
export async function refundFromReports(orderId: string, amount: number, reason: string) {
  const result = await mutate(`/orders/${encodeURIComponent(orderId)}/refund`, { amount, reason });
  if (!result.error) revalidatePath(`/orders/${orderId}`);
  return result;
}
export async function loadCustomerDetails(customerId: string, period: string, date: string, page = 1) {
  try {
    const query = new URLSearchParams({ period, date, page: String(page) });
    const data = await apiJson<import("@/lib/finance").CustomerDetails>(`/admin/finance/customers/${encodeURIComponent(customerId)}?${query}`, { token: (await getServerToken()) ?? undefined, cache: "no-store" });
    return { data, error: null };
  } catch (error) { return { data: null, error: (error as Error).message }; }
}

"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { getServerToken } from "@/lib/server-token";
import { apiJson } from "@/lib/api-client";
import type { CredentialProvider, CredentialResult, CredentialStatus } from "@/lib/credential-settings";

async function adminToken() {
  const user = await getCurrentUser();
  if (!user?.isActive || user.role !== "admin") throw new Error("Admin access required.");
  return (await getServerToken()) ?? undefined;
}
export async function readCredentialSettings(): Promise<CredentialResult> {
  try { return { data: await apiJson<CredentialStatus>("/settings/credentials", { token: await adminToken(), cache: "no-store" }), error: null }; }
  catch { return { data: null, error: "Credential settings could not load. Try again." }; }
}
export async function saveCredentialSettings(provider: CredentialProvider, action: "save" | "reset", revision: string, values: Record<string, string>): Promise<CredentialResult> {
  try {
    const token = await adminToken();
    if (!["google", "smtp", "recaptcha"].includes(provider)) return { data: null, error: "Choose a supported integration." };
    const data = await apiJson<CredentialStatus>(`/settings/credentials/${provider}`, { token, method: "PUT", body: JSON.stringify({ action, revision, values }) });
    revalidatePath("/admin/settings");
    revalidatePath("/login");
    revalidatePath("/signup");
    return { data, error: null };
  } catch (error) { return { data: null, error: error instanceof Error ? error.message : "Credentials could not be saved. Try again." }; }
}

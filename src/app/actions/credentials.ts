"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { getServerToken } from "@/lib/server-token";
import { apiJson } from "@/lib/api-client";
import type { CredentialProvider, CredentialResult, CredentialStatus, CredentialOtp, CredentialOtpResult, CredentialAccess, CredentialAccessResult } from "@/lib/credential-settings";

async function adminToken() {
  const user = await getCurrentUser();
  if (!user?.isActive || user.role !== "admin") throw new Error("Admin access required.");
  return (await getServerToken()) ?? undefined;
}
export async function readCredentialSettings(accessToken?: string): Promise<CredentialResult> {
  try { return { data: await apiJson<CredentialStatus>("/settings/credentials", { token: await adminToken(), headers: accessToken ? { "X-Credential-Access": accessToken } : {}, cache: "no-store" }), error: null }; }
  catch (error) { return { data: null, error: error instanceof Error ? error.message : "Credential settings could not load." }; }
}
export async function saveCredentialSettings(provider: CredentialProvider, action: "save" | "reset", revision: string, values: Record<string, string>, accessToken: string): Promise<CredentialResult> {
  try {
    const token = await adminToken();
    if (!["google", "smtp", "recaptcha"].includes(provider)) return { data: null, error: "Choose a supported integration." };
    const data = await apiJson<CredentialStatus>(`/settings/credentials/${provider}`, { token, headers: { "X-Credential-Access": accessToken }, method: "PUT", body: JSON.stringify({ action, revision, values }) });
    revalidatePath("/admin/settings"); revalidatePath("/login"); revalidatePath("/signup");
    return { data, error: null };
  } catch (error) { return { data: null, error: error instanceof Error ? error.message : "Credentials could not be saved." }; }
}
export async function requestCredentialOtp(): Promise<CredentialOtpResult> {
  try { return { data: await apiJson<CredentialOtp>("/settings/credentials/access/otp", { token: await adminToken(), method: "POST", body: "{}" }), error: null }; }
  catch (error) { return { data: null, error: error instanceof Error ? error.message : "Verification email could not be sent." }; }
}
export async function verifyCredentialOtp(challenge_id: string, otp: string): Promise<{ verified: boolean; error: string | null }> {
  try {
    await apiJson("/settings/credentials/access/verify-otp", { token: await adminToken(), method: "POST", body: JSON.stringify({ challenge_id, otp }) });
    return { verified: true, error: null };
  } catch (error) { return { verified: false, error: error instanceof Error ? error.message : "Verification failed." }; }
}
export async function unlockCredentialSettings(challenge_id: string, pin: string): Promise<CredentialAccessResult> {
  try { return { data: await apiJson<CredentialAccess>("/settings/credentials/access/unlock", { token: await adminToken(), method: "POST", body: JSON.stringify({ challenge_id, pin }) }), error: null }; }
  catch (error) { return { data: null, error: error instanceof Error ? error.message : "Credentials could not be unlocked." }; }
}
export async function lockCredentialSettings(accessToken: string): Promise<void> {
  try { await apiJson("/settings/credentials/access/lock", { token: await adminToken(), headers: { "X-Credential-Access": accessToken }, method: "POST", body: "{}" }); }
  catch { /* Browser values are cleared regardless; the server grant also expires independently. */ }
}
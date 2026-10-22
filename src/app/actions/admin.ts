"use server";

import { revalidatePath } from "next/cache";
import { getServerToken } from "@/lib/server-token";
import { apiJson } from "@/lib/api-client";
import type { Role } from "@/types/database";
import { phoneError } from "@/lib/phone";

export type AdminActionState = { error: string | null; success: string | null; warning?: string };

export async function createStaffAccount(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  if (!fullName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a name and valid email address.", success: null };
  if (phoneError(phone)) return { error: phoneError(phone), success: null };
  const token = await getServerToken();
  try {
    const result = await apiJson<{ setup_email_sent: boolean }>("/admin/team/create", {
      method: "POST",
      token: token ?? undefined,
      body: JSON.stringify({
        full_name: fullName,
        email,
        phone: phone || null,
        role: String(formData.get("role") ?? "staff"),
      }),
    });
    revalidatePath("/admin/team");
    return { error: null, success: "Account created.", ...(result.setup_email_sent ? {} : { warning: "The setup email could not be delivered. Ask the user to request a new link from Forgot your password." }) };
  } catch (err: unknown) {
    return { error: (err as Error).message, success: null };
  }
}

export async function grantRole(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const role = String(formData.get("role") ?? "staff") as Role;

  if (!email) return { error: "Enter the email address of an existing account.", success: null };

  const token = await getServerToken();
  try {
    await apiJson("/admin/team/grant", {
      method: "POST",
      token: token ?? undefined,
      body: JSON.stringify({ email, role }),
    });
    revalidatePath("/admin/team");
    return { error: null, success: `${email} is now ${role === "admin" ? "an admin" : "staff"}.` };
  } catch (err: unknown) {
    return { error: (err as Error).message, success: null };
  }
}

export async function setAccountActive(
  userId: string,
  active: boolean
): Promise<{ error: string | null }> {
  const token = await getServerToken();
  try {
    await apiJson(`/admin/team/${userId}/active`, {
      method: "PUT",
      token: token ?? undefined,
      body: JSON.stringify({ is_active: active }),
    });
    revalidatePath("/admin/team");
    return { error: null };
  } catch (err: unknown) {
    return { error: (err as Error).message };
  }
}

export async function revokeRole(userId: string): Promise<{ error: string | null }> {
  return updateUserRole(userId, "customer");
}

export async function updateUserRole(userId: string, role: Role): Promise<{ error: string | null }> {
  const token = await getServerToken();
  try {
    await apiJson(`/admin/team/${userId}/role`, {
      method: "PUT",
      token: token ?? undefined,
      body: JSON.stringify({ role }),
    });
    revalidatePath("/admin/team");
    return { error: null };
  } catch (err: unknown) {
    return { error: (err as Error).message };
  }
}

export async function updateStaffCredentials(userId: string, data: {
  full_name?: string; email?: string; phone?: string; password?: string;
}): Promise<{ error: string | null }> {
  if (data.phone !== undefined && phoneError(data.phone)) return { error: phoneError(data.phone) };
  const token = await getServerToken();
  try {
    await apiJson(`/admin/team/${userId}/credentials`, {
      method: "PUT",
      token: token ?? undefined,
      body: JSON.stringify(data),
    });
    revalidatePath("/admin/team");
    return { error: null };
  } catch (err: unknown) { return { error: (err as Error).message }; }
}

export async function deleteUserAccount(userId: string): Promise<{ error: string | null }> {
  const token = await getServerToken();
  try {
    await apiJson(`/admin/team/${userId}`, { method: "DELETE", token: token ?? undefined });
    revalidatePath("/admin/team");
    revalidatePath("/admin/activity");
    revalidatePath("/admin/performance");
    return { error: null };
  } catch (error) { return { error: (error as Error).message }; }
}

"use server";

import { revalidatePath } from "next/cache";
import { getServerToken } from "@/lib/server-token";
import { apiJson } from "@/lib/api-client";
import type { Role } from "@/types/database";

export type AdminActionState = { error: string | null; success: string | null };

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
  const token = await getServerToken();
  try {
    await apiJson(`/admin/team/${userId}/role`, {
      method: "PUT",
      token: token ?? undefined,
      body: JSON.stringify({ role: "customer" }),
    });
    revalidatePath("/admin/team");
    return { error: null };
  } catch (err: unknown) {
    return { error: (err as Error).message };
  }
}

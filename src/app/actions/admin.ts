"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/types/database";

/**
 * Team management.
 *
 * There is no "create a staff account" action here, and that is deliberate.
 * Creating an `auth.users` row requires Supabase's Auth admin API, which
 * requires the service-role key — a key that bypasses every RLS policy in the
 * database. Putting it in a server action makes it reachable by anything that
 * can reach that action, and one authorisation bug away from total compromise.
 *
 * So the flow is: the person signs up through the normal form like any other
 * customer, and an admin grants them a role by email. One extra step for the
 * shop, and the god-mode key never enters the application.
 */

export type AdminActionState = { error: string | null; success: string | null };

export async function grantRole(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const role = String(formData.get("role") ?? "staff") as Role;

  if (!email) {
    return { error: "Enter the email address of an existing account.", success: null };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("set_user_role", {
    target_email: email,
    new_role: role,
  });

  if (error) return { error: error.message, success: null };

  revalidatePath("/admin/team");
  return {
    error: null,
    success: `${email} is now ${role === "admin" ? "an admin" : "staff"}.`,
  };
}

export async function setAccountActive(
  userId: string,
  active: boolean
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("set_user_active", {
    target_id: userId,
    active,
  });

  revalidatePath("/admin/team");
  return { error: error?.message ?? null };
}

export async function revokeRole(userId: string): Promise<{ error: string | null }> {
  const supabase = await createClient();

  // Demotion is by email, and the directory RPC is the only thing that can see
  // one — so the address is fetched from there rather than trusted from the
  // client, which would let a crafted request demote an arbitrary account.
  const { data, error: lookupError } = await supabase.rpc("list_team");

  if (lookupError) return { error: lookupError.message };

  const member = (data as { id: string; email: string }[] | null)?.find(
    (m) => m.id === userId
  );

  if (!member) return { error: "That account is no longer on the team." };

  const { error } = await supabase.rpc("set_user_role", {
    target_email: member.email,
    new_role: "customer",
  });

  revalidatePath("/admin/team");
  return { error: error?.message ?? null };
}

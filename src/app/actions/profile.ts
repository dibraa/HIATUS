"use server";

import { revalidatePath } from "next/cache";
import { getServerToken } from "@/lib/supabase/server";
import { apiJson } from "@/lib/api-client";

export type ProfileState = { error: string | null; success: boolean };

export async function updateProfile(
  _prevState: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const fullName = String(formData.get("full_name") ?? "");
  const phone = String(formData.get("phone") ?? "");
  const token = await getServerToken();
  if (!token) return { error: "Not logged in.", success: false };

  try {
    await apiJson("/profile", {
      method: "PUT",
      token,
      body: JSON.stringify({ full_name: fullName, phone }),
    });
    revalidatePath("/profile");
    return { error: null, success: true };
  } catch (err: unknown) {
    return { error: (err as Error).message, success: false };
  }
}

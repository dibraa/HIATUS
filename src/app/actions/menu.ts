"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerToken } from "@/lib/server-token";
import { apiFetch, apiJson } from "@/lib/api-client";

export type MenuFormState = { error: string | null };

export async function saveMenuItem(
  _prevState: MenuFormState,
  formData: FormData
): Promise<MenuFormState> {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const flavor = String(formData.get("flavor") ?? "").trim();
  const category = String(formData.get("category") ?? "coffee").trim();
  const price = Number(formData.get("price"));
  let imageUrl = String(formData.get("image_url") ?? "").trim();
  const photo = formData.get("photo");
  const isAvailable = formData.get("is_available") === "on";

  if (!name || !flavor || Number.isNaN(price) || price < 0)
    return { error: "Name, flavor, and a valid price are required." };

  const token = await getServerToken();

  if (photo instanceof File && photo.size > 0) {
    const uploadData = new FormData();
    uploadData.append("photo", photo);
    try {
      const uploadResponse = await apiFetch("/menu/upload", {
        method: "POST",
        token: token ?? undefined,
        body: uploadData,
      });
      const uploadResult = (await uploadResponse.json()) as { url?: string; error?: string };
      if (!uploadResponse.ok || !uploadResult.url) throw new Error(uploadResult.error ?? "Photo upload failed");
      imageUrl = uploadResult.url;
    } catch (err: unknown) {
      return { error: (err as Error).message };
    }
  }

  const payload = { name, description: description || null, flavor, category, price, image_url: imageUrl || null, is_available: isAvailable };

  try {
    if (id) {
      await apiJson(`/menu/${id}`, { method: "PUT", token: token ?? undefined, body: JSON.stringify(payload) });
    } else {
      await apiJson("/menu", { method: "POST", token: token ?? undefined, body: JSON.stringify(payload) });
    }
  } catch (err: unknown) {
    return { error: (err as Error).message };
  }

  revalidatePath("/admin/menu");
  revalidatePath("/");
  redirect("/admin/menu");
}

export async function deleteMenuItem(id: string): Promise<{ error: string | null }> {
  const token = await getServerToken();
  try {
    await apiJson(`/menu/${id}`, { method: "DELETE", token: token ?? undefined });
    revalidatePath("/admin/menu");
    revalidatePath("/");
    return { error: null };
  } catch (err: unknown) {
    return { error: (err as Error).message };
  }
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerToken } from "@/lib/server-token";
import { apiFetch, apiJson } from "@/lib/api-client";

export type MenuFormState = { error: string | null; success?: boolean };

export async function manageCategory(_state: MenuFormState, form: FormData): Promise<MenuFormState> {
  const token = await getServerToken();
  try {
    await apiJson("/menu/categories", { method: "POST", token: token ?? undefined, body: JSON.stringify({
      name: String(form.get("name") || "").trim(), previous: form.get("previous") || undefined,
      position: Number(form.get("position") || 0), remove: form.get("operation") === "delete",
    }) });
    for (const path of ["/admin/menu", "/menu", "/", "/staff", "/admin/activity"]) revalidatePath(path);
    return { error: null, success: true };
  } catch (error) { return { error: (error as Error).message }; }
}

export async function toggleMenuItem(id: string, field: "is_available", enabled: boolean): Promise<MenuFormState> {
  if (field !== "is_available") return { error: "Invalid control." };
  const token = await getServerToken();
  try {
    await apiJson(`/menu/${id}`, { method: "PUT", token: token ?? undefined, body: JSON.stringify({ [field]: enabled }) });
    for (const path of ["/admin/menu", "/menu", "/", "/staff", "/admin/activity"]) revalidatePath(path);
    return { error: null, success: true };
  } catch (error) { return { error: (error as Error).message }; }
}

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

  if (!name || !flavor || !category || !String(formData.get("price") ?? "").trim() || !Number.isFinite(price) || price < 0 || price > 1000000 || Math.abs(price * 100 - Math.round(price * 100)) > 0.000001)
    return { error: "Name, flavor, and a valid price are required." };

  const token = await getServerToken();

  // Server actions can receive a File from a different runtime realm, so an
  // instanceof File check can silently skip a valid uploaded photo.
  if (photo && typeof photo !== "string" && photo.size > 0) {
    if (photo.size > 5 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(photo.type)) return { error: "Choose a JPG, PNG, WEBP, or GIF image up to 5 MB." };
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

  const payload = { name, description: description || null, flavor, category, price, image_url: imageUrl || null, is_available: isAvailable, position: Number(formData.get("position") || 0) };

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
  revalidatePath("/menu");
  revalidatePath("/staff");
  revalidatePath("/admin/activity");
  if (formData.get("presentation") === "dialog") return { error: null, success: true };
  redirect("/admin/menu?saved=1");
}

export async function deleteMenuItem(id: string): Promise<{ error: string | null }> {
  const token = await getServerToken();
  try {
    await apiJson(`/menu/${id}`, { method: "DELETE", token: token ?? undefined });
    revalidatePath("/admin/menu");
    revalidatePath("/");
    revalidatePath("/menu");
    revalidatePath("/staff");
    return { error: null };
  } catch (err: unknown) {
    return { error: (err as Error).message };
  }
}

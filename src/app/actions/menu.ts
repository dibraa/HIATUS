"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
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
  const itemType = String(formData.get("item_type") || "drink");
  const pricingMode = String(formData.get("pricing_mode") || "sized");
  const servingLabel = String(formData.get("serving_label") || "").trim();
  const flavor = itemType === "food" ? "Original" : String(formData.get("flavor") ?? "").trim();
  const category = String(formData.get("category") ?? "coffee").trim();
  const sizePrices = {
    S: Number(formData.get("price-S")),
    M: Number(formData.get("price-M")),
    L: Number(formData.get("price-L")),
  };
  const price = sizePrices.M;
  if (pricingMode === "fixed") { sizePrices.S = price; sizePrices.L = price; }
  if (!["food", "drink"].includes(itemType) || !["fixed", "sized"].includes(pricingMode) || (itemType === "food" && pricingMode !== "fixed") || (pricingMode === "fixed" && (!servingLabel || servingLabel.length > 80 || formData.get("price-M") === null || String(formData.get("price-M")).trim() === "")))
    return { error: "Choose a valid item type, price, and serving." };
  let imageUrl = String(formData.get("image_url") ?? "").trim();
  const photo = formData.get("photo");
  const isAvailable = formData.get("is_available") === "on";

  if (!name || !flavor || !category || Object.values(sizePrices).some((value) => !Number.isFinite(value) || value < 0 || value > 1000000 || Math.abs(value * 100 - Math.round(value * 100)) > 0.000001))
    return { error: "Enter the item name, flavor, and valid prices." };

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

  const maySetAvailability = (await getCurrentUser())?.permissions.includes("menu.availability") === true;
  const payload = {
    name, description: description || null, flavor, category, price,
    item_type: itemType, pricing_mode: pricingMode, serving_label: pricingMode === "fixed" ? servingLabel : null,
    size_pricing: { S: sizePrices.S - price, M: 0, L: sizePrices.L - price },
    image_url: imageUrl || null, ...(!id || maySetAvailability ? { is_available: maySetAvailability && isAvailable } : {}), position: Number(formData.get("position") || 0),
  };

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

export type ArchivedItem = { _id: string; name: string; category: string; price: number; archived_at: string };
export type ArchivedPage = { items: ArchivedItem[]; total: number; page: number; page_size: number };
export async function readArchivedMenu(search = "", page = 1): Promise<{ data?: ArchivedPage; error: string | null }> {
  try { return { data: await apiJson<ArchivedPage>("/menu/archived?" + new URLSearchParams({ search, page: String(page) }), { token: (await getServerToken()) ?? undefined, cache: "no-store" }), error: null }; }
  catch (error) { return { error: (error as Error).message }; }
}
export async function archiveMenuItem(id: string, restore = false): Promise<{ error: string | null }> {
  try {
    await apiJson("/menu/" + id + (restore ? "/restore" : "/archive"), { method: "POST", token: (await getServerToken()) ?? undefined });
    for (const path of ["/admin/menu", "/menu", "/", "/staff", "/favorites", "/cart", "/admin/activity", "/menu/" + id]) revalidatePath(path);
    return { error: null };
  } catch (error) { return { error: (error as Error).message }; }
}

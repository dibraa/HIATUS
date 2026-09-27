"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerToken } from "@/lib/server-token";
import { apiJson } from "@/lib/api-client";
import type { PromoVerdict } from "@/types/database";

export type PromoFormState = { error: string | null };

export async function savePromotion(
  _prev: PromoFormState,
  formData: FormData
): Promise<PromoFormState> {
  const id = String(formData.get("id") ?? "");
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const discountType = String(formData.get("discount_type") ?? "percent");
  const discountValue = Number(formData.get("discount_value"));

  if (!code) return { error: "A code is required." };
  if (!/^[A-Z0-9_-]{3,24}$/.test(code)) return { error: "Codes are 3–24 characters: letters, numbers, hyphen or underscore." };
  if (!Number.isFinite(discountValue) || discountValue <= 0) return { error: "The discount must be a positive number." };
  if (discountType === "percent" && discountValue > 100) return { error: "A percentage discount cannot exceed 100." };

  const opt = (v: FormDataEntryValue | null) => { const t = String(v ?? "").trim(); return t === "" ? null : t; };
  const optNum = (v: FormDataEntryValue | null) => { const t = String(v ?? "").trim(); if (!t) return null; const n = Number(t); return Number.isFinite(n) ? n : null; };

  const startsAt = opt(formData.get("starts_at"));
  const endsAt = opt(formData.get("ends_at"));
  if (startsAt && endsAt && new Date(endsAt) <= new Date(startsAt)) return { error: "The end date has to be after the start date." };

  const payload = {
    code, description: opt(formData.get("description")), discount_type: discountType, discount_value: discountValue,
    min_order_amount: optNum(formData.get("min_order_amount")) ?? 0,
    max_discount_amount: discountType === "percent" ? optNum(formData.get("max_discount_amount")) : null,
    starts_at: startsAt, ends_at: endsAt,
    usage_limit: optNum(formData.get("usage_limit")), per_user_limit: optNum(formData.get("per_user_limit")),
    is_active: formData.get("is_active") === "on",
  };

  const token = await getServerToken();
  try {
    if (id) await apiJson(`/promotions/${id}`, { method: "PUT", token: token ?? undefined, body: JSON.stringify(payload) });
    else await apiJson("/promotions", { method: "POST", token: token ?? undefined, body: JSON.stringify(payload) });
  } catch (err: unknown) {
    const msg = (err as Error).message;
    return { error: msg.includes("already exists") ? `The code ${code} already exists.` : msg };
  }

  revalidatePath("/admin/promos");
  redirect("/admin/promos");
}

export async function setPromotionActive(id: string, isActive: boolean): Promise<{ error: string | null }> {
  const token = await getServerToken();
  try {
    await apiJson(`/promotions/${id}`, { method: "PUT", token: token ?? undefined, body: JSON.stringify({ is_active: isActive }) });
    revalidatePath("/admin/promos");
    return { error: null };
  } catch (err: unknown) { return { error: (err as Error).message }; }
}

export async function deletePromotion(id: string): Promise<{ error: string | null }> {
  const token = await getServerToken();
  try {
    await apiJson(`/promotions/${id}`, { method: "DELETE", token: token ?? undefined });
    revalidatePath("/admin/promos");
    return { error: null };
  } catch (err: unknown) { return { error: (err as Error).message }; }
}

export async function checkPromoCode(code: string, subtotal: number): Promise<PromoVerdict> {
  const token = await getServerToken();
  try {
    const result = await apiJson<PromoVerdict & { promotion_id: string }>("/orders/promo/evaluate", {
      method: "POST",
      token: token ?? undefined,
      body: JSON.stringify({ code, subtotal }),
    });
    return result;
  } catch {
    return { valid: false, promotion_id: null, code: null, discount: 0, message: "That code is not recognised." };
  }
}

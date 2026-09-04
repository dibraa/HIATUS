"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { PromoVerdict } from "@/types/database";

export type PromoFormState = { error: string | null };

/**
 * Promotion CRUD.
 *
 * Writes go through ordinary PostgREST rather than an RPC, because the
 * `promotions_admin_write` RLS policy already says exactly the right thing:
 * only an admin may write, full stop. There is no per-column rule to enforce
 * and no price to re-derive, so a security-definer function would add a layer
 * without adding a guarantee.
 *
 * What DOES need care is the empty string. An HTML form submits absent
 * optional fields as "", and "" is not null — writing it into `ends_at` would
 * fail the timestamp cast, and into `usage_limit` would silently become 0 and
 * make the promo unusable by everyone. Every optional field is normalised
 * back to null on the way in.
 */
function optionalNumber(value: FormDataEntryValue | null): number | null {
  const text = String(value ?? "").trim();
  if (text === "") return null;
  const n = Number(text);
  return Number.isFinite(n) ? n : null;
}

function optionalText(value: FormDataEntryValue | null): string | null {
  const text = String(value ?? "").trim();
  return text === "" ? null : text;
}

export async function savePromotion(
  _prev: PromoFormState,
  formData: FormData
): Promise<PromoFormState> {
  const id = String(formData.get("id") ?? "");
  const code = String(formData.get("code") ?? "").trim().toUpperCase();
  const discountType = String(formData.get("discount_type") ?? "percent");
  const discountValue = Number(formData.get("discount_value"));

  if (!code) return { error: "A code is required." };
  if (!/^[A-Z0-9_-]{3,24}$/.test(code)) {
    return {
      error: "Codes are 3–24 characters: letters, numbers, hyphen or underscore.",
    };
  }
  if (!Number.isFinite(discountValue) || discountValue <= 0) {
    return { error: "The discount must be a positive number." };
  }
  if (discountType === "percent" && discountValue > 100) {
    return { error: "A percentage discount cannot exceed 100." };
  }

  const startsAt = optionalText(formData.get("starts_at"));
  const endsAt = optionalText(formData.get("ends_at"));

  // Caught here rather than by the database, because Postgres has no opinion
  // about it and a promo that ends before it starts is simply never valid —
  // the shop would create it, see nothing happen, and have no idea why.
  if (startsAt && endsAt && new Date(endsAt) <= new Date(startsAt)) {
    return { error: "The end date has to be after the start date." };
  }

  const payload = {
    code,
    description: optionalText(formData.get("description")),
    discount_type: discountType,
    discount_value: discountValue,
    min_order_amount: optionalNumber(formData.get("min_order_amount")) ?? 0,
    max_discount_amount:
      discountType === "percent"
        ? optionalNumber(formData.get("max_discount_amount"))
        : null,
    starts_at: startsAt,
    ends_at: endsAt,
    usage_limit: optionalNumber(formData.get("usage_limit")),
    per_user_limit: optionalNumber(formData.get("per_user_limit")),
    is_active: formData.get("is_active") === "on",
  };

  const supabase = await createClient();
  const { error } = id
    ? await supabase.from("promotions").update(payload).eq("id", id)
    : await supabase.from("promotions").insert(payload);

  if (error) {
    // The unique index is on upper(code), so a clash here is always a
    // duplicate code — worth saying plainly instead of leaking the constraint.
    if (error.code === "23505") {
      return { error: `The code ${code} already exists.` };
    }
    return { error: error.message };
  }

  revalidatePath("/admin/promos");
  redirect("/admin/promos");
}

export async function setPromotionActive(
  id: string,
  isActive: boolean
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("promotions")
    .update({ is_active: isActive })
    .eq("id", id);

  revalidatePath("/admin/promos");
  return { error: error?.message ?? null };
}

export async function deletePromotion(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.from("promotions").delete().eq("id", id);

  revalidatePath("/admin/promos");
  return { error: error?.message ?? null };
}

/**
 * Checkout's preview of a code.
 *
 * Calls the same `evaluate_promo` that `create_order` calls to APPLY the
 * discount, so what the customer is quoted and what they are charged cannot
 * disagree. The subtotal is passed for the calculation but is not trusted:
 * `create_order` recomputes it from the menu before applying anything.
 */
export async function checkPromoCode(
  code: string,
  subtotal: number
): Promise<PromoVerdict> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("evaluate_promo", {
    promo_code: code,
    order_subtotal: subtotal,
  });

  if (error) {
    return {
      valid: false,
      promotion_id: null,
      code: null,
      discount: 0,
      message: error.message,
    };
  }

  const verdict = (data as PromoVerdict[] | null)?.[0];

  return (
    verdict ?? {
      valid: false,
      promotion_id: null,
      code: null,
      discount: 0,
      message: "That code is not recognised.",
    }
  );
}

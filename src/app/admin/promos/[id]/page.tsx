import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServerToken } from "@/lib/supabase/server";
import { apiJson } from "@/lib/api-client";
import { PageHeader } from "@/components/ui/page-header";
import type { Promotion } from "@/types/database";
import { PromoForm } from "../promo-form";

export const metadata: Metadata = { title: "Edit promo" };

export default async function EditPromoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = await getServerToken();
  const raw = await apiJson<(Promotion & { _id: string }) | null>(`/promotions/${id}`, { token: token ?? undefined }).catch(() => null);
  if (!raw) notFound();
  const promotion: Promotion = { ...raw, id: raw._id ?? raw.id };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={`Edit ${promotion.code}`}
        description="Changes apply to new redemptions only."
      />
      <PromoForm promotion={promotion} />
    </div>
  );
}

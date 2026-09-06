import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { formatPrice, formatDateTime } from "@/lib/format";
import type { Promotion } from "@/types/database";
import { PromoForm } from "../promo-form";

export const metadata: Metadata = { title: "Edit promo" };

type Redemption = {
  id: string;
  discount_amount: number;
  created_at: string;
  profiles: { full_name: string | null } | null;
};

export default async function EditPromoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: promotion } = await supabase
    .from("promotions")
    .select("*")
    .eq("id", id)
    .single<Promotion>();

  if (!promotion) notFound();

  const { data: redemptions } = await supabase
    .from("promo_redemptions")
    .select("id, discount_amount, created_at, profiles(full_name)")
    .eq("promotion_id", id)
    .order("created_at", { ascending: false })
    .limit(20)
    .returns<Redemption[]>();

  const used = redemptions ?? [];

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title={`Edit ${promotion.code}`}
        description="Changes apply to new redemptions only — anything already claimed keeps the discount it was given."
      />

      <PromoForm promotion={promotion} />

      {used.length > 0 && (
        <section aria-labelledby="redemptions-heading" className="mt-10">
          <h2
            id="redemptions-heading"
            className="mb-3 eyebrow text-muted"
          >
            Recent redemptions
          </h2>

          <ul className="divide-y divide-line rounded-lg border border-line bg-card">
            {used.map((r) => (
              <li
                key={r.id}
                className="flex items-baseline justify-between gap-4 px-4 py-2.5 text-sm"
              >
                <span className="min-w-0 truncate text-ink-soft">
                  {r.profiles?.full_name?.trim() || "A customer"}
                </span>
                <span className="flex shrink-0 items-baseline gap-3">
                  <span className="font-medium numeric text-ink">
                    −{formatPrice(r.discount_amount)}
                  </span>
                  <time
                    dateTime={r.created_at}
                    className="text-xs numeric text-muted"
                  >
                    {formatDateTime(r.created_at)}
                  </time>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

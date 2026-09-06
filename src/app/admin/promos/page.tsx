import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { FormError } from "@/components/ui/field";
import { formatPrice, formatDate, formatPercent } from "@/lib/format";
import type { PromoPerformance } from "@/types/database";
import { PromoActions } from "./promo-actions";
import { ExportButton } from "../reports/export-button";

export const metadata: Metadata = { title: "Promos" };

export const dynamic = "force-dynamic";

/**
 * Why a promo is or is not currently usable.
 *
 * `is_active` alone is not the answer — a code can be switched on and still be
 * refused for being scheduled, expired or fully claimed. Saying which is the
 * difference between "the promo is broken" and "the promo ends on Friday".
 */
function liveState(promo: PromoPerformance): {
  label: string;
  tone: "success" | "neutral" | "warning" | "danger";
} {
  if (!promo.is_active) return { label: "Switched off", tone: "neutral" };

  const now = Date.now();
  if (promo.starts_at && new Date(promo.starts_at).getTime() > now) {
    return { label: "Scheduled", tone: "warning" };
  }
  if (promo.ends_at && new Date(promo.ends_at).getTime() < now) {
    return { label: "Expired", tone: "danger" };
  }
  if (promo.usage_limit !== null && promo.redemptions >= promo.usage_limit) {
    return { label: "Fully claimed", tone: "danger" };
  }
  return { label: "Live", tone: "success" };
}

export default async function PromosPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("promo_performance");

  const promos = (data as PromoPerformance[] | null) ?? [];

  const liveCount = promos.filter((p) => liveState(p).label === "Live").length;
  const redemptions = promos.reduce((sum, p) => sum + p.redemptions, 0);
  const given = promos.reduce((sum, p) => sum + p.discount_given, 0);
  const influenced = promos.reduce((sum, p) => sum + p.revenue_influenced, 0);

  return (
    <div>
      <PageHeader
        title="Promotional codes"
        description="Create codes, set the rules, and see what each campaign actually returned."
        action={
          <ButtonLink href="/admin/promos/new" size="md">
            New promo
          </ButtonLink>
        }
      />

      <StatGrid>
        <StatCard label="Live now" value={liveCount} hint={`${promos.length} total`} />
        <StatCard label="Redemptions" value={redemptions} hint="All time" />
        <StatCard
          label="Discount given"
          value={formatPrice(given)}
          hint="What the codes cost"
        />
        <StatCard
          label="Revenue influenced"
          value={formatPrice(influenced)}
          tone="positive"
          hint="Completed orders that used a code"
        />
      </StatGrid>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <h2 className="eyebrow text-muted">
          All codes
        </h2>
        <ExportButton data={{ kind: "promos", rows: promos }} label="Export performance" />
      </div>

      <div className="mt-3">
        {error ? (
          <FormError>{error.message}</FormError>
        ) : promos.length === 0 ? (
          <EmptyState
            title="No promo codes yet"
            body="Create a code and it will be redeemable at checkout straight away."
            action={<ButtonLink href="/admin/promos/new">Create the first one</ButtonLink>}
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {promos.map((promo) => {
              const state = liveState(promo);
              // Redemption rate only means something against a cap. Without a
              // usage limit there is no denominator, and inventing one (say,
              // against total orders) would be a number that looks precise and
              // measures nothing.
              const rate =
                promo.usage_limit && promo.usage_limit > 0
                  ? (promo.redemptions / promo.usage_limit) * 100
                  : null;

              return (
                <li
                  key={promo.id}
                  className="rounded-lg border border-line bg-card p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/admin/promos/${promo.id}`}
                          className="font-mono text-sm font-semibold tracking-wide text-ink underline-offset-4 hover:underline"
                        >
                          {promo.code}
                        </Link>
                        <Badge tone={state.tone}>{state.label}</Badge>
                      </p>

                      <p className="mt-1 text-sm text-ink-soft">
                        {promo.discount_type === "percent"
                          ? `${promo.discount_value}% off`
                          : `${formatPrice(promo.discount_value)} off`}
                        {promo.description && (
                          <span className="text-muted"> — {promo.description}</span>
                        )}
                      </p>

                      <p className="mt-1 text-xs text-muted">
                        {promo.starts_at || promo.ends_at ? (
                          <>
                            {promo.starts_at ? formatDate(promo.starts_at) : "Now"} —{" "}
                            {promo.ends_at ? formatDate(promo.ends_at) : "no end date"}
                          </>
                        ) : (
                          "No date limits"
                        )}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold numeric text-ink">
                        {promo.redemptions}
                        {promo.usage_limit ? (
                          <span className="font-normal text-muted">
                            {" "}
                            / {promo.usage_limit}
                          </span>
                        ) : null}
                      </p>
                      <p className="text-xs text-muted">
                        {rate === null ? "redeemed" : `${formatPercent(rate)} claimed`}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-end justify-between gap-x-4 gap-y-3 border-t border-line pt-3">
                    <dl className="flex flex-wrap gap-x-6 gap-y-1 text-xs">
                      <div>
                        <dt className="inline text-muted">Discount given: </dt>
                        <dd className="inline font-medium numeric text-ink-soft">
                          {formatPrice(promo.discount_given)}
                        </dd>
                      </div>
                      <div>
                        <dt className="inline text-muted">Revenue influenced: </dt>
                        <dd className="inline font-medium numeric text-ink-soft">
                          {formatPrice(promo.revenue_influenced)}
                        </dd>
                      </div>
                    </dl>

                    <PromoActions
                      id={promo.id}
                      code={promo.code}
                      isActive={promo.is_active}
                      redemptions={promo.redemptions}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { getServerToken } from "@/lib/server-token";
import { apiJson } from "@/lib/api-client";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { formatPrice, formatDate, formatPercent } from "@/lib/format";
import type { Promotion } from "@/types/database";
import { PromoActions } from "./promo-actions";

export const metadata: Metadata = { title: "Promos" };
export const dynamic = "force-dynamic";

type PromoWithStats = Promotion & { _id: string; usage_count: number };

function liveState(promo: PromoWithStats) {
  if (!promo.is_active) return { label: "Switched off", tone: "neutral" as const };
  const now = Date.now();
  if (promo.starts_at && new Date(promo.starts_at).getTime() > now) return { label: "Scheduled", tone: "warning" as const };
  if (promo.ends_at && new Date(promo.ends_at).getTime() < now) return { label: "Expired", tone: "danger" as const };
  if (promo.usage_limit !== null && promo.usage_count >= promo.usage_limit) return { label: "Fully claimed", tone: "danger" as const };
  return { label: "Live", tone: "success" as const };
}

export default async function PromosPage() {
  const token = await getServerToken();
  const raw = await apiJson<PromoWithStats[]>("/promotions", { token: token ?? undefined }).catch(() => []);
  const promos = raw.map((p) => ({ ...p, id: p._id ?? p.id, redemptions: p.usage_count }));

  const liveCount = promos.filter((p) => liveState(p).label === "Live").length;
  const redemptions = promos.reduce((sum, p) => sum + p.usage_count, 0);

  return (
    <div>
      <PageHeader
        title="Promotional codes"
        description="Create codes, set the rules, and see what each campaign actually returned."
        action={<ButtonLink href="/admin/promos/new" size="md">New promo</ButtonLink>}
      />

      <StatGrid>
        <StatCard label="Live now" value={liveCount} hint={`${promos.length} total`} />
        <StatCard label="Redemptions" value={redemptions} hint="All time" />
      </StatGrid>

      <div className="mt-8">
        {promos.length === 0 ? (
          <EmptyState
            title="No promo codes yet"
            body="Create a code and it will be redeemable at checkout straight away."
            action={<ButtonLink href="/admin/promos/new">Create the first one</ButtonLink>}
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {promos.map((promo) => {
              const state = liveState(promo);
              const rate = promo.usage_limit && promo.usage_limit > 0 ? (promo.usage_count / promo.usage_limit) * 100 : null;
              return (
                <li key={promo.id} className="rounded-lg border border-line bg-card p-4">
                  <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2">
                        <Link href={`/admin/promos/${promo.id}`} className="font-mono text-sm font-semibold tracking-wide text-ink underline-offset-4 hover:underline">
                          {promo.code}
                        </Link>
                        <Badge tone={state.tone}>{state.label}</Badge>
                      </p>
                      <p className="mt-1 text-sm text-ink-soft">
                        {promo.discount_type === "percent" ? `${promo.discount_value}% off` : `${formatPrice(promo.discount_value)} off`}
                        {promo.description && <span className="text-muted"> — {promo.description}</span>}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        {promo.starts_at || promo.ends_at ? (
                          <>{promo.starts_at ? formatDate(promo.starts_at) : "Now"} — {promo.ends_at ? formatDate(promo.ends_at) : "no end date"}</>
                        ) : "No date limits"}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold numeric text-ink">
                        {promo.usage_count}
                        {promo.usage_limit ? <span className="font-normal text-muted"> / {promo.usage_limit}</span> : null}
                      </p>
                      <p className="text-xs text-muted">{rate === null ? "redeemed" : `${formatPercent(rate)} claimed`}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-end justify-between gap-x-4 gap-y-3 border-t border-line pt-3">
                    <PromoActions id={promo.id} code={promo.code} isActive={promo.is_active} redemptions={promo.usage_count} />
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

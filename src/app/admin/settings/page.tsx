import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { getSettings, isOpenNow } from "@/lib/settings";
import { ROLE_DESCRIPTIONS, ROLE_LABELS } from "@/lib/roles";
import type { Role } from "@/types/database";
import {
  BusinessHoursForm,
  OrderingForm,
  PaymentMethodsForm,
  ShopInfoForm,
  TemplatesForm,
} from "./settings-forms";

export const metadata: Metadata = { title: "Settings" };

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { businessHours, paymentMethods, ordering, shopInfo, templates } =
    await getSettings();

  const { open } = isOpenNow(businessHours);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Settings"
        description="Shop-wide configuration. Changes take effect on the storefront immediately."
      />

      {/* Current state up top: the most common reason to open this page is to
          check whether the shop is showing as open, not to change anything. */}
      <div className="mb-8 flex flex-wrap items-center gap-3 rounded-lg border border-line bg-raised px-4 py-3">
        <Badge tone={open ? "success" : "neutral"}>
          {open ? "Open now" : "Closed now"}
        </Badge>
        <Badge tone={ordering.accepting_orders ? "success" : "danger"}>
          {ordering.accepting_orders ? "Taking orders" : "Orders paused"}
        </Badge>
        <p className="text-sm text-muted">
          Based on the hours below and the shop&rsquo;s own clock (Asia/Manila).
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <OrderingForm ordering={ordering} />
        <BusinessHoursForm hours={businessHours} />
        <PaymentMethodsForm methods={paymentMethods} />
        <ShopInfoForm info={shopInfo} />
        <TemplatesForm templates={templates} />

        {/* ---------- Access control reference ---------- */}
        <section
          aria-labelledby="access-heading"
          className="rounded-lg border border-line bg-card p-5"
        >
          <h2
            id="access-heading"
            className="text-xl font-semibold tracking-tight text-ink"
          >
            Roles and access
          </h2>
          <p className="mt-1.5 max-w-[60ch] text-sm text-muted">
            Permissions are fixed to three roles rather than configurable per
            person. Fewer, well-understood roles are harder to misconfigure than
            a permission matrix, and every check in the database is written
            against these three.
          </p>

          <dl className="mt-4 flex flex-col gap-3">
            {(["customer", "staff", "admin"] as Role[]).map((role) => (
              <div key={role} className="rounded-md border border-line bg-raised p-3">
                <dt className="text-sm font-semibold text-ink">
                  {ROLE_LABELS[role]}
                </dt>
                <dd className="mt-0.5 text-sm text-ink-soft">
                  {ROLE_DESCRIPTIONS[role]}
                </dd>
              </div>
            ))}
          </dl>

          <p className="mt-4 text-xs text-muted">
            Grant and revoke roles on the Team screen. Access is enforced in
            three places — the request-time guard, each area&rsquo;s layout, and
            the database&rsquo;s own row-level security — so a gap in one does
            not open the others.
          </p>
        </section>
      </div>
    </div>
  );
}

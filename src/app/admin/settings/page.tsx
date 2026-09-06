import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { getSettings, isOpenNow } from "@/lib/settings";
import { ROLE_LABELS } from "@/lib/roles";
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
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Settings"
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
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <OrderingForm ordering={ordering} />
        <PaymentMethodsForm methods={paymentMethods} />
        <div className="lg:col-span-2">
          <BusinessHoursForm hours={businessHours} />
        </div>
        <ShopInfoForm info={shopInfo} />
        <TemplatesForm templates={templates} />

        {/* ---------- Access control reference ---------- */}
        <section
          aria-labelledby="access-heading"
          className="rounded-lg border border-line bg-card p-5 lg:col-span-2"
        >
          <h2
            id="access-heading"
            className="text-xl font-semibold tracking-tight text-ink"
          >
            Roles and access
          </h2>
          <dl className="mt-4 flex flex-col gap-3">
            {(["customer", "staff", "admin"] as Role[]).map((role) => (
              <div key={role} className="rounded-md border border-line bg-raised p-3">
                <dt className="text-sm font-semibold text-ink">
                  {ROLE_LABELS[role]}
                </dt>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { ReceiptSettingsForm } from "./receipt-settings";
import { SettingsNavigation } from "./settings-navigation";
import { AdminPageHeader as PageHeader } from "@/components/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { getSettings, isOpenNow } from "@/lib/settings";
import { IntegrationSettingsForm } from "./integration-settings";
import type { IntegrationSettings } from "@/lib/integrations";
import { apiJson } from "@/lib/api-client";
import { getServerToken } from "@/lib/server-token";
import type { AuthenticationSettings } from "@/lib/authentication-options";
import { AuthenticationSettingsForm } from "./authentication-settings";
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
  let integrations: IntegrationSettings | null = null;
  try { integrations = await apiJson<IntegrationSettings>("/settings/integrations", { token: (await getServerToken()) ?? undefined, cache: "no-store" }); } catch { /* The form shows an unavailable state. */ }
  let receiptEnabled: boolean | null = null;
  try { receiptEnabled = (await apiJson<{ enabled: boolean }>("/settings/receipts", { token: (await getServerToken()) ?? undefined, cache: "no-store" })).enabled; } catch { /* Show an unavailable state without guessing the saved switch. */ }
  let authentication: AuthenticationSettings | null = null;
  let authenticationError: string | null = null;
  try {
    authentication = await apiJson<AuthenticationSettings>("/settings/authentication", {
      token: (await getServerToken()) ?? undefined, cache: "no-store",
    });
  } catch {
    authenticationError = "Sign-in settings could not be loaded. Reload this page to try again.";
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Settings"
      />

      {/* Current state up top: the most common reason to open this page is to
          check whether the shop is showing as open, not to change anything. */}
      <div className="admin-settings-status">
        <span className="text-muted">Storefront status</span>
        <Badge tone={open ? "success" : "neutral"}>
          {open ? "Open now" : "Closed now"}
        </Badge>
        <Badge tone={ordering.accepting_orders ? "success" : "danger"}>
          {ordering.accepting_orders ? "Taking orders" : "Orders paused"}
        </Badge>
      </div>

      <div className="admin-settings-layout">
        <SettingsNavigation />
        <div className="admin-settings-sections">
          <section id="settings-ordering" tabIndex={-1} aria-label="Ordering settings"><OrderingForm ordering={ordering} /></section>
          <section id="settings-payments" tabIndex={-1} aria-label="Payment settings"><PaymentMethodsForm methods={paymentMethods} /></section>
          <section id="settings-hours" tabIndex={-1} aria-label="Opening hours settings"><BusinessHoursForm hours={businessHours} /></section>
          <section id="settings-shop" tabIndex={-1} aria-label="Shop details settings"><ShopInfoForm info={shopInfo} /></section>
          <section id="settings-messages" tabIndex={-1} aria-label="Order message settings"><TemplatesForm templates={templates} /></section>
          <section id="settings-api" tabIndex={-1} aria-labelledby="api-controls-heading" className="flex flex-col gap-5">
            <div><h2 id="api-controls-heading" className="text-xl font-semibold">API controls</h2></div>
            <IntegrationSettingsForm key={JSON.stringify(integrations)} settings={integrations} />
            <ReceiptSettingsForm key={String(receiptEnabled)} enabled={receiptEnabled} />
            <AuthenticationSettingsForm settings={authentication} error={authenticationError} />
          </section>


        </div>
      </div>
    </div>
  );
}

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
import { NotificationSettingsForm } from "./notification-settings";
import { DataError } from "@/components/ui/data-error";
import { CustomCredentials } from "./custom-credentials";
import { readCredentialSettings } from "@/app/actions/credentials";
import {
  BusinessHoursForm,
  OrderingForm,
  PaymentMethodsForm,
  ShopInfoForm,
} from "./settings-forms";

export const metadata: Metadata = { title: "Settings" };

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getSettings();
  const credentials = await readCredentialSettings();
  const { businessHours, ordering, shopInfo, versions, loaded } = settings;

  const open = settings.availability?.open ?? (loaded && isOpenNow(businessHours).open);
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
          {!loaded ? "Unavailable" : open ? "Open now" : "Closed now"}
        </Badge>
        <Badge tone={settings.availability?.can_order ? "success" : "danger"}>
          {settings.availability?.can_order ? "Taking orders" : "Orders paused"}
        </Badge>
        {settings.availability?.next_open_at && <span className="text-sm text-muted">Opens {new Date(settings.availability.next_open_at).toLocaleString("en-PH", { timeZone: "Asia/Manila", weekday: "short", hour: "numeric", minute: "2-digit" })}</span>}
        {settings.availability?.closes_at && <span className="text-sm text-muted">Open until {new Date(settings.availability.closes_at).toLocaleString("en-PH", { timeZone: "Asia/Manila", weekday: "short", hour: "numeric", minute: "2-digit" })}</span>}
      </div>

      <div className={loaded ? "admin-settings-layout" : ""}>
        {loaded && <SettingsNavigation />}
        <div className="admin-settings-sections">
          {loaded ? <>
          <section id="settings-ordering" tabIndex={-1} aria-label="Ordering settings"><OrderingForm ordering={ordering} version={versions.ordering} /></section>
          <section id="settings-payments" tabIndex={-1} aria-label="Payment settings"><PaymentMethodsForm /></section>
          <section id="settings-hours" tabIndex={-1} aria-label="Opening hours settings"><BusinessHoursForm hours={businessHours} version={versions.business_hours} /></section>
          <section id="settings-shop" tabIndex={-1} aria-label="Shop details settings"><ShopInfoForm info={shopInfo} version={versions.shop_info} /></section>
          <section id="settings-messages" tabIndex={-1} aria-label="Notification settings"><NotificationSettingsForm policy={settings.notifications} version={versions.notifications || 0} pushEnabled={integrations?.push_enabled ?? null} /></section>
          </> : <DataError title="Settings unavailable" body="Reload before editing settings." showRetry />}
          <section id="settings-api" tabIndex={-1} aria-labelledby="api-controls-heading" className="flex flex-col gap-5">
            <div><h2 id="api-controls-heading" className="text-xl font-semibold">API controls</h2></div>
            <IntegrationSettingsForm key={JSON.stringify(integrations)} settings={integrations} />
            <ReceiptSettingsForm key={String(receiptEnabled)} enabled={receiptEnabled} />
            <AuthenticationSettingsForm settings={authentication} error={authenticationError} />
            <CustomCredentials initial={credentials.data} />
          </section>


        </div>
      </div>
    </div>
  );
}

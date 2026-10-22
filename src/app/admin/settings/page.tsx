import type { Metadata } from "next";
import { ReceiptSettingsForm } from "./receipt-settings";
import { AdminPageHeader as PageHeader } from "@/components/admin-page-header";
import { Badge } from "@/components/ui/badge";
import { getSettings, isOpenNow } from "@/lib/settings";
import { ROLE_LABELS } from "@/lib/roles";
import type { Role } from "@/types/database";
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
        <nav className="admin-settings-nav" aria-label="Settings sections">
          <a href="#settings-ordering">Ordering</a>
          <a href="#settings-payments">Payments</a>
          <a href="#settings-receipts">Email receipts</a>
          <a href="#settings-hours">Opening hours</a>
          <a href="#settings-shop">Shop details</a>
          <a href="#settings-messages">Order messages</a>
          <a href="#settings-access">Roles and access</a>
          <a href="#settings-authentication">Sign-in and security</a>
        </nav>
        <div className="admin-settings-sections">
          <section id="settings-ordering" aria-label="Ordering settings"><OrderingForm ordering={ordering} /></section>
          <section id="settings-payments" aria-label="Payment settings"><PaymentMethodsForm methods={paymentMethods} /></section>
          <section id="settings-receipts" aria-label="Email receipt settings"><ReceiptSettingsForm key={String(receiptEnabled)} enabled={receiptEnabled} /></section>
          <section id="settings-hours" aria-label="Opening hours settings"><BusinessHoursForm hours={businessHours} /></section>
          <section id="settings-shop" aria-label="Shop details settings"><ShopInfoForm info={shopInfo} /></section>
          <section id="settings-messages" aria-label="Order message settings"><TemplatesForm templates={templates} /></section>
          <section id="settings-authentication" aria-label="Sign-in and security settings"><AuthenticationSettingsForm settings={authentication} error={authenticationError} /></section>


        </div>
      </div>
    </div>
  );
}

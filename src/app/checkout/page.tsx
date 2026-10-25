import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { getSettings } from "@/lib/settings";
import { CheckoutForm } from "./checkout-form";

export const metadata: Metadata = { title: "Checkout" };
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const settings = await getSettings();
  const estimatedMinutes = settings.ordering.default_prep_minutes;

  return (
    <div className="mx-auto max-w-lg py-2">
      <PageHeader title="Checkout"  />
      <CheckoutForm
        paymentMethods={settings.paymentMethods}
        ordering={settings.ordering}
        estimatedMinutes={estimatedMinutes}
      />
    </div>
  );
}

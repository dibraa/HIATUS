import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { getSettings } from "@/lib/settings";
import type { WaitTimeStats } from "@/types/database";
import { CheckoutForm } from "./checkout-form";

export const metadata: Metadata = { title: "Checkout" };

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const supabase = await createClient();

  const [settings, { data: waitRows }] = await Promise.all([
    getSettings(),
    supabase.rpc("wait_time_stats", { days_back: 7 }),
  ]);

  const waits = (waitRows as WaitTimeStats[] | null)?.[0];

  // A measured median beats a configured guess — but only once there are
  // enough orders for the median to mean anything. Below that the shop's own
  // setting is the better answer.
  const estimatedMinutes =
    waits && waits.sample_size >= 5
      ? waits.median_minutes
      : settings.ordering.default_prep_minutes;

  return (
    <div className="mx-auto max-w-lg py-2">
      <PageHeader
        title="Checkout"
        description="A couple of choices, then we start making it."
      />

      <CheckoutForm
        paymentMethods={settings.paymentMethods}
        ordering={settings.ordering}
        estimatedMinutes={estimatedMinutes}
      />
    </div>
  );
}

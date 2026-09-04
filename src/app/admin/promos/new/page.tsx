import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { PromoForm } from "../promo-form";

export const metadata: Metadata = { title: "New promo" };

export default function NewPromoPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="New promo code"
        description="The code becomes redeemable at checkout as soon as it is active and inside its date window."
      />
      <PromoForm />
    </div>
  );
}

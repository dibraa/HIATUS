import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { FilterTabs } from "@/components/ui/filter-tabs";
import { FormError } from "@/components/ui/field";
import type { BestSellingFlavor } from "@/types/database";
import { BestSellerChart } from "./best-seller-chart";

export const metadata: Metadata = { title: "Analytics" };

const RANGES = [
  { label: "Last 7 days", value: "7" },
  { label: "Last 30 days", value: "30" },
  { label: "All time", value: "all" },
];

const DEFAULT_RANGE = "30";

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const { days: daysParam } = await searchParams;
  const selected = daysParam ?? DEFAULT_RANGE;
  const days = selected === "all" ? null : Number(selected);

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("best_selling_flavors", { days_back: days });

  const flavors = (data ?? []) as BestSellingFlavor[];

  return (
    <div>
      <PageHeader
        title="Best-selling flavors"
        description="Units sold per flavour across completed orders. A plain rollup of order history, not a forecast."
      />

      <FilterTabs
        label="Filter analytics by date range"
        className="mb-6"
        tabs={RANGES.map((r) => ({
          label: r.label,
          href: "/admin?days=" + r.value,
          active: r.value === selected,
        }))}
      />

      {error ? <FormError>{error.message}</FormError> : <BestSellerChart data={flavors} />}
    </div>
  );
}

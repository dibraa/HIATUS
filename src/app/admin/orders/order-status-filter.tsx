"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { SelectField } from "@/components/ui/field";

type OrderStatusTab = {
  label: string;
  value: string;
};

export function OrderStatusFilter({
  currentTab,
  tabs,
}: {
  currentTab: string;
  tabs: OrderStatusTab[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="admin-orders-filter mb-6">
      <SelectField
        id="order-status-filter"
        label="Filter orders by status"
        className="admin-orders-filter-select"
        value={tabs.some((tab) => tab.value === currentTab) ? currentTab : "active"}
        disabled={pending}
        onChange={(event) => {
          const nextTab = event.target.value;
          startTransition(() => {
            router.push("/admin/orders?tab=" + nextTab);
          });
        }}
      >
        {tabs.map((tab) => (
          <option key={tab.value} value={tab.value}>
            {tab.label}
          </option>
        ))}
      </SelectField>
    </div>
  );
}

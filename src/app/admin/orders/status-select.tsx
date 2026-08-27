"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { SelectField } from "@/components/ui/field";
import { updateOrderStatus } from "@/app/actions/orders";
import type { OrderStatus } from "@/types/database";

/** Written out rather than title-casing the enum, so the option list reads the
 *  same as the badge sitting next to it. */
const OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "preparing", label: "Preparing" },
  { value: "ready", label: "Ready for pickup" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export function StatusSelect({
  orderId,
  status,
  customerName,
}: {
  orderId: string;
  status: OrderStatus;
  customerName: string;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <SelectField
      // A page renders a list of these, so the label has to say which order it
      // drives. Hidden visually - the card already names the customer.
      id={"status-" + orderId}
      label={"Order status for " + customerName}
      hideLabel
      className="w-auto py-1.5 text-xs"
      value={status}
      disabled={pending}
      onChange={(e) => {
        const newStatus = e.target.value as OrderStatus;
        startTransition(async () => {
          const result = await updateOrderStatus(orderId, newStatus);
          if (result.error) {
            toast.error(result.error);
            return;
          }
          const option = OPTIONS.find((o) => o.value === newStatus);
          toast.success("Order marked " + (option?.label ?? newStatus).toLowerCase());
          router.refresh();
        });
      }}
    >
      {OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </SelectField>
  );
}

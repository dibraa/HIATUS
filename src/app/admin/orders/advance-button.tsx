"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { ADVANCE_LABELS, NEXT_STATUS } from "@/lib/order-meta";
import { advanceOrderStatus } from "@/app/actions/staff";
import type { OrderStatus } from "@/types/database";

export function AdvanceButton({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const next = NEXT_STATUS[status];
  const label = ADVANCE_LABELS[status];

  if (!next || !label) return null;

  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          const result = await advanceOrderStatus(orderId, next);
          if (result.error) {
            toast.error(result.error);
            return;
          }
          toast.success(`Order advanced to ${next}`);
          router.refresh();
        });
      }}
    >
      {pending ? "..." : label}
    </Button>
  );
}

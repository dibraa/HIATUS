"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { cancelOrder } from "@/app/actions/orders";
import { Button } from "@/components/ui/button";

export function CancelButton({ orderId }: { orderId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <Button
        variant="secondary"
        size="sm"
        disabled={pending}
        className="border-danger/50 text-danger hover:bg-danger-soft-bg hover:text-danger-soft-fg"
        onClick={() =>
          startTransition(async () => {
            // window.confirm rather than a custom modal: it is focus-trapped,
            // Escape-dismissable and screen-reader-announced by the platform,
            // and this is a rare, single-decision action.
            if (!window.confirm("Cancel this order? This cannot be undone.")) return;

            const result = await cancelOrder(orderId);
            if (result.error) {
              toast.error(result.error);
              return;
            }
            toast.success("Order cancelled");
            router.refresh();
          })
        }
      >
        {pending ? "Cancelling…" : "Cancel order"}
      </Button>

      <p className="text-xs text-muted">Only possible while the order is still pending.</p>
    </div>
  );
}

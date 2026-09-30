"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { cancelOrder } from "@/app/actions/orders";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

export function CancelButton({ orderId }: { orderId: string }) {
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const router = useRouter();

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <Button
        variant="danger"
        size="sm"
        disabled={pending}
        className="border-danger/50 text-danger hover:bg-danger-soft-bg hover:text-danger-soft-fg"
        onClick={() => setConfirmOpen(true)}
      >
        {pending ? "Cancelling…" : "Cancel order"}
      </Button>

      <p className="text-xs text-muted">Only possible while the order is still pending.</p>

      <Modal
        open={confirmOpen}
        title="Cancel this order?"
        body="This cannot be undone. The order will be cancelled and any payment will be refunded."
        confirmLabel="Cancel order"
        cancelLabel="Keep it"
        danger
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          startTransition(async () => {
            const result = await cancelOrder(orderId);
            if (result.error) {
              toast.error(result.error);
              return;
            }
            toast.success("Order cancelled");
            router.refresh();
          });
        }}
      />
    </div>
  );
}

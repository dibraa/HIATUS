"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { cancelOrder } from "@/app/actions/orders";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

export function CancelButton({ orderId, paid }: { orderId: string; paid: boolean }) {
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

      <p className="text-xs text-muted">Cancel before preparation starts.</p>

      <Modal
        open={confirmOpen}
        title="Cancel this order?"
        body={paid ? "The order will be cancelled. Ask staff to return your payment; a refund is recorded only after staff confirms it." : "This cannot be undone. The order will be cancelled. No payment has been recorded; if you have paid since opening this page, ask staff about your refund."}
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
            toast.success(result.refundRequired ? "Order cancelled. Ask staff about your refund." : "Order cancelled");
            router.refresh();
          });
        }}
      />
    </div>
  );
}

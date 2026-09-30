"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { deleteMenuItem } from "@/app/actions/menu";
import { Modal } from "@/components/ui/modal";

export function DeleteButton({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <button
        type="button"
        disabled={pending}
        className="text-sm font-medium text-muted transition-colors hover:text-danger disabled:opacity-50"
        onClick={() => setConfirmOpen(true)}
      >
        {pending ? "Deleting…" : "Delete"}
        <span className="sr-only"> {name}</span>
      </button>

      <Modal
        open={confirmOpen}
        title={`Delete "${name}"?`}
        body="This cannot be undone. The drink will be removed from the storefront immediately."
        confirmLabel="Delete"
        cancelLabel="Keep it"
        danger
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          startTransition(async () => {
            const result = await deleteMenuItem(id);
            if (result.error) {
              toast.error(result.error);
              return;
            }
            toast.success("Deleted");
            router.refresh();
          });
        }}
      />
    </>
  );
}

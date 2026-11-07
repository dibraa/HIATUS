"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { archiveMenuItem } from "@/app/actions/menu";
import { Modal } from "@/components/ui/modal";

export function ArchiveButton({ id, name }: { id: string; name: string }) {
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
        {pending ? "Archiving…" : "Archive"}
        <span className="sr-only"> {name}</span>
      </button>

      <Modal
        open={confirmOpen}
        title={`Archive "${name}"?`}
        body="Hide this item from the menu? Order history stays intact. Restore it from Archived items."
        confirmLabel="Archive"
        cancelLabel="Keep it"
        danger
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          startTransition(async () => {
            const result = await archiveMenuItem(id);
            if (result.error) {
              toast.error(result.error);
              return;
            }
            toast.success("Item archived");
            router.refresh();
          });
        }}
      />
    </>
  );
}

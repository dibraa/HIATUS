"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { deleteMenuItem } from "@/app/actions/menu";

export function DeleteButton({ id, name }: { id: string; name: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={pending}
      // Muted until hovered, then danger-coloured: destructive actions should
      // be reachable without being the most eye-catching thing in the row.
      className="text-sm font-medium text-muted transition-colors hover:text-danger disabled:opacity-50"
      onClick={() => {
        if (!window.confirm('Delete "' + name + '"? This cannot be undone.')) return;
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
    >
      {pending ? "Deleting…" : "Delete"}
      {/* Names the target, so a list of "Delete" links is navigable by voice
          and readable out of context. */}
      <span className="sr-only"> {name}</span>
    </button>
  );
}

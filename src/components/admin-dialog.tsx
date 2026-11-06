"use client";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { AdminIcon } from "@/components/admin-icon";
export function AdminDialog({ title, description, pending, onClose, children, confirmation = false, wide = false, closeLabel }: {
  title: string;
  description: string;
  pending: boolean;
  onClose: () => void;
  children: ReactNode;
  confirmation?: boolean;
  wide?: boolean;
  closeLabel?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();

  useEffect(() => {
    const dialog = ref.current;
    const trigger = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      if (trigger?.isConnected) trigger.focus();
    };
  }, []);

  useEffect(() => {
    ref.current?.querySelector<HTMLElement>("input:not(:disabled), button:not(:disabled)")?.focus();
  }, [confirmation]);

  return (
    <dialog
      ref={ref}
      role={confirmation ? "alertdialog" : "dialog"}
      aria-modal="true"
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
      aria-busy={pending}
      className={`fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] ${wide ? "max-w-4xl" : "max-w-lg"} overflow-y-auto rounded-2xl border border-line bg-card p-0 text-left text-ink backdrop:bg-scrim`}
      onCancel={(event) => {
        event.preventDefault();
        if (!pending) onClose();
      }}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(
          'input:not(:disabled), button:not(:disabled), select:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])',
        )).filter((element) => element.getClientRects().length > 0);
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (!first) { event.preventDefault(); return; }
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !pending) {
          const bounds = event.currentTarget.getBoundingClientRect();
          if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
        }
      }}
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <h2 id={`${id}-title`} className="display min-w-0 text-2xl text-ink">{title}</h2>
          {closeLabel && <button type="button" aria-label={closeLabel} disabled={pending} onClick={onClose} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-muted hover:bg-raised hover:text-ink disabled:opacity-50"><AdminIcon name="close" /></button>}
        </div>
        <p id={`${id}-description`} className="mt-2 break-words text-sm text-muted">{description}</p>
        <div className="mt-5">{children}</div>
      </div>
    </dialog>
  );
}


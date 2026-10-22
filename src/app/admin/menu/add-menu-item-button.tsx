"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { AdminIcon } from "@/components/admin-icon";
import { MenuItemForm } from "./menu-item-form";

export function AddMenuItemButton({ children = "Add item" }: { children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const panel = dialog.current;
    const opener = trigger.current;
    const previousOverflow = document.body.style.overflow;
    panel?.showModal();
    panel?.querySelector<HTMLInputElement>('input[name="name"]')?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      panel?.close();
      document.body.style.overflow = previousOverflow;
      if (opener?.isConnected) opener.focus();
    };
  }, [open]);

  const close = useCallback(() => { if (!pending) setOpen(false); }, [pending]);
  const saved = useCallback(() => {
    setOpen(false);
    toast.success("Menu item added.");
    router.refresh();
  }, [router]);

  return <>
    <Button ref={trigger} size="md" aria-haspopup="dialog" aria-expanded={open} onClick={() => { setPending(false); setOpen(true); }}>{children}</Button>
    {open && <dialog ref={dialog} className="admin-menu-dialog" aria-modal="true" aria-labelledby={titleId} aria-busy={pending}
      onCancel={event => { event.preventDefault(); close(); }}
      onClick={event => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) close();
      }}
      onKeyDown={event => {
        if (event.key !== "Tab") return;
        const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled):not([type="hidden"]), select:not(:disabled), textarea:not(:disabled), a[href]')).filter(element => element.getClientRects().length > 0);
        const first = controls[0], last = controls[controls.length - 1];
        if (!first) { event.preventDefault(); return; }
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }}>
      <div className="admin-menu-dialog-header">
        <h2 id={titleId} className="text-xl font-semibold">Add menu item</h2>
        <button type="button" className="flex min-h-11 min-w-11 items-center justify-center rounded-md text-muted hover:bg-raised hover:text-ink disabled:opacity-50" aria-label="Close add menu item" disabled={pending} onClick={close}><AdminIcon name="close" /></button>
      </div>
      <MenuItemForm onSaved={saved} onCancel={close} onPendingChange={setPending} />
    </dialog>}
  </>;
}

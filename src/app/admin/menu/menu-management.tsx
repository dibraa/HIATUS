"use client";

import { useActionState, useCallback, useEffect, useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { manageCategory, toggleMenuItem } from "@/app/actions/menu";
import { Button } from "@/components/ui/button";
import { AdminIcon } from "@/components/admin-icon";
import { TextField, FormError, FormSuccess } from "@/components/ui/field";
import type { MenuItem } from "@/types/database";
import { MenuItemForm } from "./menu-item-form";

export type Category = { name: string; position: number };

export function EditMenuItemButton({ item }: { item: MenuItem }) {
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
    toast.success("Menu item updated.");
    router.refresh();
  }, [router]);

  return <>
    <Button ref={trigger} variant="ghost" size="sm" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>
      Edit<span className="sr-only"> {item.name}</span>
    </Button>
    {open && <dialog ref={dialog} className="admin-menu-dialog" aria-modal="true" aria-labelledby={titleId} aria-busy={pending}
      onCancel={event => { event.preventDefault(); close(); }}
      onClick={event => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) close();
      }}>
      <div className="admin-menu-dialog-header">
        <h2 id={titleId} className="text-xl font-semibold">Edit {item.name}</h2>
        <button type="button" className="flex min-h-11 min-w-11 items-center justify-center rounded-md text-muted hover:bg-raised hover:text-ink disabled:opacity-50" aria-label={`Close edit ${item.name}`} disabled={pending} onClick={close}><AdminIcon name="close" /></button>
      </div>
      <MenuItemForm item={item} onSaved={saved} onCancel={close} onPendingChange={setPending} />
    </dialog>}
  </>;
}

function CategoryForm({ category }: { category?: Category }) {
  const [state, action, pending] = useActionState(manageCategory, { error: null });
  return <form action={action} className="flex flex-wrap items-end gap-3 border-t border-line py-4" aria-label={category ? `Manage ${category.name}` : "Add category"}>
    {category && <input type="hidden" name="previous" value={category.name} />}
    <TextField id={`category-${category?.name || "new"}`} name="name" label={category ? "Category" : "New category"} required maxLength={80} defaultValue={category?.name || ""} />
    <TextField id={`position-${category?.name || "new"}`} name="position" label="Filter position" type="number" min="0" max="100000" step="1" defaultValue={category?.position ?? 0} />
    <Button type="submit" disabled={pending}>{pending ? "Saving…" : category ? "Save category" : "Add category"}</Button>
    {category && <Button type="submit" variant="ghost" name="operation" value="delete" disabled={pending}>Delete empty category</Button>}
    <div className="w-full" aria-live="polite"><FormError>{state.error}</FormError>{state.success && <FormSuccess>Category updated.</FormSuccess>}</div>
  </form>;
}
export function CategoryManager({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();

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

  const close = useCallback(() => setOpen(false), []);

  return <>
    <Button ref={trigger} variant="ghost" size="md" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>
      Manage categories
    </Button>
    {open && <dialog
      ref={dialog}
      className="admin-menu-dialog admin-category-dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onCancel={event => { event.preventDefault(); close(); }}
      onClick={event => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) close();
      }}
      onKeyDown={event => {
        if (event.key !== "Tab") return;
        const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled):not([type="hidden"]), select:not(:disabled)')).filter(element => element.getClientRects().length > 0);
        const first = controls[0], last = controls[controls.length - 1];
        if (!first) { event.preventDefault(); return; }
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }}
    >
      <div className="admin-menu-dialog-header">
        <h2 id={titleId} className="text-xl font-semibold">Manage categories</h2>
        <button type="button" className="flex min-h-11 min-w-11 items-center justify-center rounded-md text-muted hover:bg-raised hover:text-ink" aria-label="Close manage categories" onClick={close}><AdminIcon name="close" /></button>
      </div>
      <div className="admin-category-dialog-body">
        {categories.map(category => <CategoryForm key={category.name} category={category} />)}
        <CategoryForm />
      </div>
    </dialog>}
  </>;
}
export function ItemToggles({ item }: { item: MenuItem }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  function change(field: "is_available", enabled: boolean) {
    start(async () => {
      const result = await toggleMenuItem(item.id, field, enabled);
      if (result.error) toast.error(result.error);
      else { toast.success("Menu updated."); router.refresh(); }
    });
  }
  return <div className="flex flex-wrap gap-2" aria-label={`Availability for ${item.name}`}>
    <Button variant="ghost" disabled={pending} aria-pressed={item.is_available} onClick={() => change("is_available", !(item.is_available))}>{(item.is_available) ? "Mark sold out" : "Make available"}</Button>
  </div>;
}

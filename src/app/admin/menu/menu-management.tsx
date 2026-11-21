"use client";
import { withPermission } from "@/components/permission-controls";

import { useActionState, useCallback, useEffect, useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { manageCategory, toggleMenuItem } from "@/app/actions/menu";
import { Button } from "@/components/ui/button";
import { AdminIcon } from "@/components/admin-icon";
import { TextField, FormError, FormSuccess } from "@/components/ui/field";
import type { MenuItem } from "@/types/database";
import { MenuItemForm } from "./menu-item-form";
import { useEditTurn } from "./edit-turn";
import { formatTime } from "@/lib/format";

export type Category = { name: string; position: number };

function EditMenuItemButtonContent({ item }: { item: MenuItem }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  // One session per opening: the server lines sessions up in the order Edit was clicked.
  const [session, setSession] = useState<string | null>(null);
  const { turn, markActive } = useEditTurn(item.id, open ? session : null);
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
    document.body.style.overflow = "hidden";
    return () => {
      panel?.close();
      document.body.style.overflow = previousOverflow;
      if (opener?.isConnected) opener.focus();
    };
  }, [open]);
  useEffect(() => {
    if (turn.status === "editing") dialog.current?.querySelector<HTMLInputElement>('input[name="name"]')?.focus();
  }, [turn.status]);
  // "Your turn ends in m:ss if you stay inactive", from the server's last answer.
  const endsAt = turn.status === "editing" ? turn.endsAt : null;
  const [remaining, setRemaining] = useState<number | null>(null);
  useEffect(() => {
    if (endsAt === null) return;
    const timer = setInterval(() => setRemaining(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000))), 1000);
    return () => clearInterval(timer);
  }, [endsAt]);

  const close = useCallback(() => { if (!pending) setOpen(false); }, [pending]);
  const saved = useCallback(() => {
    setOpen(false);
    toast.success("Menu item updated.");
    router.refresh();
  }, [router]);
  const begin = () => { setRemaining(null); setSession(crypto.randomUUID()); setOpen(true); };

  return <>
    <Button ref={trigger} variant="ghost" size="sm" className="min-h-11 min-w-11" aria-haspopup="dialog" aria-expanded={open} onClick={begin}>
      Edit<span className="sr-only"> {item.name}</span>
    </Button>
    {open && <dialog ref={dialog} className="admin-menu-dialog" aria-modal="true" aria-labelledby={titleId} aria-busy={pending || turn.status === "joining"}
      onInput={markActive} onKeyDown={markActive} onPointerDown={markActive}
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
      {turn.status === "joining" && <p role="status" className="p-6 text-sm text-muted">Checking whether someone else is editing this item…</p>}
      {turn.status === "waiting" && <div role="status" className="flex flex-col items-start gap-3 p-6">
        <p className="font-semibold text-ink">⏳ {turn.editor.name} is editing this item since {formatTime(turn.editor.started_at)}.</p>
        <p className="text-sm text-ink-soft">You&apos;re #{turn.position} in line. The editor opens here when it&apos;s your turn.</p>
        <Button variant="outline" onClick={close}>Leave line</Button>
      </div>}
      {turn.status === "editing" && <>
        {remaining !== null && <p className="px-6 pt-4 text-sm text-muted">Your turn ends in {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")} if you stay inactive.</p>}
        <MenuItemForm key={session} item={turn.item} editSession={session ?? undefined} onSaved={saved} onCancel={close} onPendingChange={setPending} />
      </>}
      {(turn.status === "ended" || turn.status === "error") && <div role="alert" className="flex flex-col items-start gap-3 p-6">
        <p className="text-ink">{turn.status === "ended" ? "Your editing turn ended after 5 minutes without activity, or the connection dropped. Unsaved changes were not kept." : turn.message}</p>
        <div className="flex flex-wrap gap-3">
          {turn.status === "ended" && <Button onClick={begin}>Edit again</Button>}
          <Button variant="ghost" onClick={close}>Close</Button>
        </div>
      </div>}
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
function CategoryManagerContent({ categories }: { categories: Category[] }) {
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
function ItemTogglesContent({ item }: { item: MenuItem }) {
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

export const CategoryManager = withPermission("menu.categories", CategoryManagerContent);

export const EditMenuItemButton = withPermission("menu.edit", EditMenuItemButtonContent);

export const ItemToggles = withPermission("menu.availability", ItemTogglesContent);

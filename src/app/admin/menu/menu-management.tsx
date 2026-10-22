"use client";

import { useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { manageCategory, toggleMenuItem } from "@/app/actions/menu";
import { Button } from "@/components/ui/button";
import { TextField, FormError, FormSuccess } from "@/components/ui/field";
import type { MenuItem } from "@/types/database";

export type Category = { name: string; position: number };
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
  return <details className="admin-panel mb-5"><summary className="flex min-h-11 cursor-pointer items-center font-medium">Manage categories</summary>
    <p className="my-3 text-sm text-muted">Rename categories for all their items. Lower positions appear first in the category filter. Move items before deleting a category.</p>
    {categories.map(category => <CategoryForm key={category.name} category={category} />)}
    <CategoryForm />
  </details>;
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

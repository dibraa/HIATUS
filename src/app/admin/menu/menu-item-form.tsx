"use client";

import { useActionState, useState } from "react";
import { saveMenuItem, type MenuFormState } from "@/app/actions/menu";
import {
  TextField,
  TextAreaField,
  CheckboxField,
  FormError,
} from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/ui/product-image";
import type { MenuItem } from "@/types/database";

const initialState: MenuFormState = { error: null };

export function MenuItemForm({ item }: { item?: MenuItem }) {
  const [state, formAction, pending] = useActionState(saveMenuItem, initialState);
  const [imageUrl, setImageUrl] = useState(item?.image_url ?? "");

  return (
    <form action={formAction} className="grid gap-5 sm:grid-cols-2">
      {item && <input type="hidden" name="id" value={item.id} />}
      <input type="hidden" name="image_url" value={imageUrl} />

      <TextField id="name" name="name" label="Name" required defaultValue={item?.name} placeholder="e.g. Spanish Latte" />
      <TextField id="flavor" name="flavor" label="Flavor" required placeholder="e.g. Caramel" defaultValue={item?.flavor} />
      <TextField id="category" name="category" label="Category" defaultValue={item?.category ?? "coffee"} />
      <TextField id="price" name="price" label="Price (PHP)" type="number" min="0" step="0.01" required inputMode="decimal" defaultValue={item?.price} />
      <TextAreaField id="description" name="description" label="Description" rows={3} defaultValue={item?.description ?? ""} />

      <div className="flex flex-col gap-2">
        <TextField
          id="image_url_input"
          name="image_url_input"
          label="Photo URL"
          placeholder="https://..."
          defaultValue={item?.image_url ?? ""}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setImageUrl(e.target.value)}
        />
        {imageUrl && (
          <div className="w-24">
            <ProductImage src={imageUrl} alt="Preview" sizes="96px" rounded="rounded-md" />
          </div>
        )}
      </div>

      <div className="flex items-start pt-1">
        <CheckboxField id="is_available" name="is_available" label="Available on the menu" defaultChecked={item?.is_available ?? true} />
      </div>

      <FormError>{state.error}</FormError>

      <Button type="submit" size="md" disabled={pending} className="self-start sm:col-span-2">
        {pending ? "Saving…" : "Save item"}
      </Button>
    </form>
  );
}

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
import { Field } from "@/components/ui/field";
import type { MenuItem } from "@/types/database";

const initialState: MenuFormState = { error: null };

export function MenuItemForm({ item }: { item?: MenuItem }) {
  const [state, formAction, pending] = useActionState(saveMenuItem, initialState);
  const imageUrl = item?.image_url ?? "";
  const [imagePreview, setImagePreview] = useState(item?.image_url ?? "");

  return (
    <form action={formAction} className="admin-menu-form">
      {item && <input type="hidden" name="id" value={item.id} />}
      <input type="hidden" name="image_url" value={imageUrl} />

      <section className="admin-form-section" aria-labelledby="product-details-heading">
        <h2 id="product-details-heading">Product details</h2>
        <div className="admin-form-fields">
          <TextField id="name" name="name" label="Name" required defaultValue={item?.name} placeholder="e.g. Spanish Latte" />
          <TextField id="flavor" name="flavor" label="Flavor" required placeholder="e.g. Caramel" defaultValue={item?.flavor} />
          <TextField id="category" name="category" label="Category" defaultValue={item?.category ?? "coffee"} />
          <TextAreaField id="description" name="description" label="Description" rows={3} defaultValue={item?.description ?? ""} />
        </div>
      </section>

      <section className="admin-form-section" aria-labelledby="product-photo-heading">
        <h2 id="product-photo-heading">Product photo</h2>
        <div className="mt-5">
          <Field id="photo" label="Photo" hint="JPG, PNG, WEBP, or GIF up to 5 MB">
            <input
              id="photo"
              name="photo"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="w-full rounded-md border border-line-strong bg-card px-3 py-2.5 text-sm text-ink file:mr-3 file:rounded file:border-0 file:bg-raised file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-ink"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) setImagePreview(URL.createObjectURL(file));
              }}
            />
            {imagePreview && (
              <div className="w-24">
                <ProductImage src={imagePreview} alt="Preview" sizes="96px" rounded="rounded-md" />
              </div>
            )}
          </Field>
        </div>
      </section>

      <section className="admin-form-section" aria-labelledby="pricing-heading">
        <h2 id="pricing-heading">Pricing and availability</h2>
        <div className="admin-form-fields">
          <TextField id="price" name="price" label="Price (PHP)" type="number" min="0" step="0.01" required inputMode="decimal" defaultValue={item?.price} />
          <div className="flex items-center pt-1">
            <CheckboxField id="is_available" name="is_available" label="Available on the menu" defaultChecked={item?.is_available ?? true} />
          </div>
        </div>
      </section>

      <FormError>{state.error}</FormError>

      <div className="admin-form-footer">
        <Button type="submit" size="md" disabled={pending}>
          {pending ? "Saving…" : "Save item"}
        </Button>
      </div>
    </form>
  );
}

"use client";
import { usePermissions } from "@/components/permission-controls";

import { useActionState, useState, useEffect, type ChangeEvent } from "react";
import { saveMenuItem, type MenuFormState } from "@/app/actions/menu";
import {
  TextField,
  TextAreaField,
  CheckboxField,
  SelectField,
  FormError,
} from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/ui/product-image";
import { Field } from "@/components/ui/field";
import type { MenuItem } from "@/types/database";
import { apiJson } from "@/lib/api-client";

const initialState: MenuFormState = { error: null };

export function MenuItemForm({ item, onSaved, onCancel, onPendingChange }: {
  item?: MenuItem;
  onSaved?: () => void;
  onCancel?: () => void;
  onPendingChange?: (pending: boolean) => void;
}) {
  const { can } = usePermissions();
  const [state, formAction, pending] = useActionState(saveMenuItem, initialState);
  const [categories, setCategories] = useState<{ name: string }[]>([]);
  useEffect(() => { let active = true; apiJson<{ name: string }[]>("/menu/categories", { cache: "no-store" }).then(values => { if (active) setCategories(values); }).catch(() => {}); return () => { active = false; }; }, []);
  const [fields, setFields] = useState({
    name: item?.name ?? "", flavor: item?.flavor ?? "", category: item?.category ?? "coffee",
    description: item?.description ?? "",
    item_type: item?.item_type ?? "drink",
    pricing_mode: item?.pricing_mode ?? (item ? "sized" : "fixed"),
    serving_label: item?.serving_label ?? (item?.item_type === "food" ? "Per serving" : "Per drink"),
    price: {
      S: String(item ? item.price + (item.size_pricing?.S ?? -15) : ""),
      M: String(item ? item.price + (item.size_pricing?.M ?? 0) : ""),
      L: String(item ? item.price + (item.size_pricing?.L ?? 25) : ""),
    },
    is_available: item?.is_available ?? true,
    position: String(item?.position ?? 0),
  });
  function updateText(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = event.target;
    if (name.startsWith("price-")) {
      const size = name.slice(-1) as "S" | "M" | "L";
      setFields(previous => ({ ...previous, price: { ...previous.price, [size]: value } }));
    } else {
      setFields(previous => ({ ...previous, [name]: value }));
    }
  }
  const imageUrl = item?.image_url ?? "";
  const [imagePreview, setImagePreview] = useState(item?.image_url ?? "");
  const [imageError, setImageError] = useState<string | null>(null);
  useEffect(() => () => { if (imagePreview.startsWith("blob:")) URL.revokeObjectURL(imagePreview); }, [imagePreview]);
  useEffect(() => { onPendingChange?.(pending); }, [pending, onPendingChange]);
  useEffect(() => { if (state.success) onSaved?.(); }, [state.success, onSaved]);

  return (
    <form action={formAction} className="admin-menu-form" aria-busy={pending}>
      {onSaved && <input type="hidden" name="presentation" value="dialog" />}
      {item && <input type="hidden" name="id" value={item.id} />}
      <input type="hidden" name="image_url" value={imageUrl} />

      <section className="admin-form-section" aria-labelledby="product-details-heading">
        <h2 id="product-details-heading">Product details</h2>
        <div className="admin-form-fields">
          <TextField id="name" name="name" label="Name" maxLength={120} required value={fields.name} onChange={updateText} placeholder="e.g. Spanish Latte" />
          <SelectField id="item_type" name="item_type" label="Item type" value={fields.item_type} onChange={event => setFields(previous => ({ ...previous, item_type: event.target.value as "food" | "drink", pricing_mode: event.target.value === "food" ? "fixed" : previous.pricing_mode, serving_label: event.target.value === "food" ? "Per serving" : "Per drink" }))}>
            <option value="drink">Drink</option><option value="food">Food</option>
          </SelectField>
          {fields.item_type === "food" ? <input type="hidden" name="flavor" value="Original" /> : <TextField id="flavor" name="flavor" label="Flavor" maxLength={80} required placeholder="e.g. Caramel" value={fields.flavor} onChange={updateText} />}
          <TextField id="category" name="category" label="Category" list="menu-categories" maxLength={80} required value={fields.category} onChange={updateText} />
          <datalist id="menu-categories">{categories.map(category => <option key={category.name} value={category.name} />)}</datalist>
          <TextAreaField id="description" name="description" label="Description" maxLength={2000} rows={3} value={fields.description} onChange={updateText} />
        </div>
      </section>

      <section className="admin-form-section" aria-labelledby="organization-heading">
        <h2 id="organization-heading">Organization</h2>
        <div className="admin-form-fields">
          <TextField id="position" name="position" label="Item position (lower first within category)" type="number" min="0" max="100000" step="1" value={fields.position} onChange={updateText} />
        </div>
      </section>
      <div className="admin-menu-form-side">
        <section className="admin-form-section" aria-labelledby="product-photo-heading">
          <h2 id="product-photo-heading">Product photo</h2>
          <div className="mt-5">
            <Field id="photo" label="Photo" hint="JPG, PNG, WEBP, or GIF up to 5 MB" error={imageError}>
              <input
                id="photo"
                name="photo"
                type="file"
                aria-invalid={Boolean(imageError)}
                aria-describedby={imageError ? "photo-error" : "photo-hint"}
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="w-full rounded-md border border-line-strong bg-card px-3 py-2.5 text-sm text-ink file:mr-3 file:rounded file:border-0 file:bg-raised file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-ink"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  setImageError(null);
                  if (file && (file.size > 5 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type))) {
                    event.target.value = "";
                    setImageError("Choose a supported image up to 5 MB.");
                    setImagePreview(imageUrl);
                  } else if (file) setImagePreview(URL.createObjectURL(file));
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
            <SelectField id="pricing_mode" name="pricing_mode" label="Pricing" value={fields.pricing_mode} onChange={event => setFields(previous => ({ ...previous, pricing_mode: event.target.value as "fixed" | "sized" }))}>
              <option value="fixed">One fixed price</option><option value="sized" disabled={fields.item_type === "food"}>Small / Medium / Large</option>
            </SelectField>
            {fields.pricing_mode === "fixed" && <TextField id="serving_label" name="serving_label" label="Serving" maxLength={80} required value={fields.serving_label} onChange={updateText} placeholder="e.g. 22 oz or 2–3 persons" />}
            {(fields.pricing_mode === "fixed" ? ["M"] as const : ["S", "M", "L"] as const).map(size => (
              <TextField key={size} id={`price-${size}`} name={`price-${size}`} label={fields.pricing_mode === "fixed" ? "Price (PHP)" : `${size === "S" ? "Small" : size === "M" ? "Medium" : "Large"} price (PHP)`} type="number" min="0" max="1000000" step="0.01" required inputMode="decimal" value={fields.price[size]} onChange={updateText} />
            ))}
            <div className="flex items-center pt-1">
              <fieldset disabled={!can("menu.availability")}>
<CheckboxField id="is_available" name="is_available" label="Available on the menu" checked={fields.is_available} onChange={event => setFields(previous => ({ ...previous, is_available: event.target.checked }))} />
</fieldset>
            </div>
          </div>
        </section>
      </div>
      <FormError>{state.error}</FormError>

      <div className="admin-form-footer">
        {onCancel && <Button type="button" variant="ghost" disabled={pending} onClick={onCancel}>Cancel</Button>}
        <Button type="submit" size="md" disabled={pending}>
          {pending ? "Saving…" : "Save item"}
        </Button>
      </div>
    </form>
  );
}

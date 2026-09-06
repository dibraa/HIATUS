"use client";

import { useActionState, useState } from "react";
import toast from "react-hot-toast";
import { createClient } from "@/lib/supabase/client";
import { saveMenuItem, type MenuFormState } from "@/app/actions/menu";
import {
  Field,
  TextField,
  TextAreaField,
  CheckboxField,
  FormError,
} from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/ui/product-image";
import { SIZE_OPTIONS } from "@/lib/sizes";
import type { MenuItem } from "@/types/database";

const initialState: MenuFormState = { error: null };

export function MenuItemForm({ item }: { item?: MenuItem }) {
  const [state, formAction, pending] = useActionState(saveMenuItem, initialState);
  const [imageUrl, setImageUrl] = useState(item?.image_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);

    const supabase = createClient();
    const path = Date.now() + "-" + file.name;
    const { error } = await supabase.storage.from("menu-images").upload(path, file);

    if (error) {
      // Shown inline as well as toasted: a toast that has already faded is no
      // help to someone who looked away, and this failure blocks the save.
      setUploadError(error.message);
      toast.error("Upload failed: " + error.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("menu-images").getPublicUrl(path);
    setImageUrl(data.publicUrl);
    setUploading(false);
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {item && <input type="hidden" name="id" value={item.id} />}
      <input type="hidden" name="image_url" value={imageUrl} />

      <TextField
        id="name"
        name="name"
        label="Name"
        required
        defaultValue={item?.name}
        placeholder="e.g. Spanish Latte"
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          id="flavor"
          name="flavor"
          label="Flavor"
          required
          placeholder="e.g. Caramel"
          defaultValue={item?.flavor}
          hint="Drives the storefront filter and the best-seller report."
        />
        <TextField
          id="category"
          name="category"
          label="Category"
          defaultValue={item?.category ?? "coffee"}
        />
      </div>

      {/* The price/size relationship is a rule the admin cannot see anywhere
          else, so the field states it rather than leaving it to be discovered
          when a customer is charged an unexpected amount. */}
      <TextField
        id="price"
        name="price"
        label="Price (PHP)"
        type="number"
        min="0"
        step="0.01"
        required
        inputMode="decimal"
        defaultValue={item?.price}
        hint={"This is the MEDIUM price. Small is " + SIZE_OPTIONS[0].priceDelta + ", large is +" + SIZE_OPTIONS[2].priceDelta + "."}
      />

      <TextAreaField
        id="description"
        name="description"
        label="Description"
        rows={3}
        defaultValue={item?.description ?? ""}
        hint="One or two lines. Shown on the card and the product page."
      />

      <Field
        id="image"
        label="Photo"
        hint="Square images crop best. Optional — items without one get a placeholder."
        error={uploadError}
      >
        <input
          id="image"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          aria-describedby={uploadError ? "image-error" : "image-hint"}
          className="w-full text-sm text-ink-soft file:mr-3 file:rounded-md file:border file:border-line-strong file:bg-card file:px-4 file:py-2 file:text-xs file:uppercase file:tracking-widest file:text-ink hover:file:bg-raised"
        />
      </Field>

      {/* Status of the upload, announced rather than only shown. */}
      <p aria-live="polite" className="sr-only">
        {uploading ? "Uploading photo" : imageUrl ? "Photo ready" : ""}
      </p>

      {uploading && <p className="text-xs text-muted">Uploading…</p>}

      {imageUrl && !uploading && (
        <div className="w-24">
          <ProductImage src={imageUrl} alt="Current photo for this item" sizes="96px" rounded="rounded-md" />
        </div>
      )}

      <CheckboxField
        id="is_available"
        name="is_available"
        label="Available on the menu"
        defaultChecked={item?.is_available ?? true}
        hint="Unchecked items still appear, marked sold out, and cannot be added to a cart."
      />

      <FormError>{state.error}</FormError>

      <Button
        type="submit"
        size="md"
        // Blocked during upload: submitting now would save the item with the
        // previous photo URL, silently discarding the one being uploaded.
        disabled={pending || uploading}
        className="self-start"
      >
        {pending ? "Saving…" : "Save item"}
      </Button>
    </form>
  );
}

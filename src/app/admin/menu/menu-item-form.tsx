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
    <form action={formAction} className="grid gap-5 sm:grid-cols-2">
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

      <TextField
        id="flavor"
        name="flavor"
        label="Flavor"
        required
        placeholder="e.g. Caramel"
        defaultValue={item?.flavor}
      />
      <TextField
        id="category"
        name="category"
        label="Category"
        defaultValue={item?.category ?? "coffee"}
      />


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
      />

      <TextAreaField
        id="description"
        name="description"
        label="Description"
        rows={3}
        defaultValue={item?.description ?? ""}
      />

      <div>
        <Field
          id="image"
          label="Photo"
          error={uploadError}
        >
          <input
            id="image"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            aria-describedby={uploadError ? "image-error" : "image-hint"}
            className="w-full text-sm text-ink-soft file:mr-3 file:rounded-full file:border file:border-line-strong file:bg-card file:px-4 file:py-2 file:text-sm file:font-medium file:text-ink hover:file:bg-raised"
          />

          {uploading && <p className="mt-2 text-xs text-muted">Uploading...</p>}

          {imageUrl && !uploading && (
            <div className="mt-3 w-24">
              <ProductImage
                src={imageUrl}
                alt="Current photo for this item"
                sizes="96px"
                rounded="rounded-md"
              />
            </div>
          )}
        </Field>
      </div>

      {/* Status of the upload, announced rather than only shown. */}
      <p aria-live="polite" className="sr-only">
        {uploading ? "Uploading photo" : imageUrl ? "Photo ready" : ""}
      </p>

      <div className="flex items-start pt-1">
        <CheckboxField
          id="is_available"
          name="is_available"
          label="Available on the menu"
          defaultChecked={item?.is_available ?? true}
        />
      </div>

      <FormError>{state.error}</FormError>

      <Button
        type="submit"
        size="md"
        // Blocked during upload: submitting now would save the item with the
        // previous photo URL, silently discarding the one being uploaded.
        disabled={pending || uploading}
        className="self-start sm:col-span-2"
      >
        {pending ? "Saving…" : "Save item"}
      </Button>
    </form>
  );
}

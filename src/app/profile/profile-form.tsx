"use client";

import { useActionState } from "react";
import { updateProfile, type ProfileState } from "@/app/actions/profile";
import { Field, TextField, FormError, FormSuccess } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import type { Profile } from "@/types/database";

const initialState: ProfileState = { error: null, success: false };

export function ProfileForm({ profile, email }: { profile: Profile; email: string }) {
  const [state, formAction, pending] = useActionState(updateProfile, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {/* Read-only mirror of the account email. It previously carried a <label>
          with no htmlFor, which is markup that looks labelled and is not —
          screen readers announced an unlabelled disabled input. */}
      <Field id="account-email" label="Email" hint="Changing this means changing your login — contact the shop.">
        <input
          id="account-email"
          value={email}
          disabled
          readOnly
          className="w-full rounded-md border border-line bg-raised px-3 py-2.5 text-sm text-muted"
        />
      </Field>

      <TextField
        id="full_name"
        name="full_name"
        label="Full name"
        defaultValue={profile.full_name ?? ""}
        autoComplete="name"
        hint="Called out when your order is ready."
      />

      <TextField
        id="phone"
        name="phone"
        label="Phone"
        type="tel"
        inputMode="tel"
        defaultValue={profile.phone ?? ""}
        autoComplete="tel"
        hint="Only used if the shop needs to reach you about an order."
      />

      <FormError>{state.error}</FormError>
      {state.success && <FormSuccess>Saved.</FormSuccess>}

      <Button type="submit" size="md" disabled={pending} className="mt-1 self-start">
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}

"use client";

import { useActionState, useEffect, useState } from "react";
import { updateProfile, type ProfileState } from "@/app/actions/profile";
import { Field, TextField, FormError, FormSuccess } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import type { Profile } from "@/types/database";

const initialState: ProfileState = { error: null, success: false };

export function ProfileForm({ profile, email }: { profile: Profile; email: string }) {
  const [state, formAction, pending] = useActionState(updateProfile, initialState);
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");

  // When the server re-renders with fresh profile props after a successful
  // save, sync the controlled inputs so they show the updated values.
  useEffect(() => {
    setFullName(profile.full_name ?? "");
    setPhone(profile.phone ?? "");
  }, [profile.full_name, profile.phone]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field id="account-email" label="Email">
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
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        autoComplete="name"
      />

      <TextField
        id="phone"
        name="phone"
        label="Phone"
        type="tel"
        inputMode="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        autoComplete="tel"
      />

      <FormError>{state.error}</FormError>
      {state.success && <FormSuccess>Saved.</FormSuccess>}

      <Button type="submit" size="md" disabled={pending} className="mt-1 self-start">
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}

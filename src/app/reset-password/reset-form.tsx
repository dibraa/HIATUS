"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TextField, FormError } from "@/components/ui/field";
import { updatePassword } from "@/app/actions/auth";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(updatePassword, {
    error: null,
    success: false,
  });

  if (state.success) {
    return (
      <div className="rounded-lg border border-line bg-card p-6 text-center">
        <h2 className="display text-xl text-ink">Password changed</h2>
        <p className="mx-auto mt-2 max-w-[42ch] text-sm text-muted">
          Log in with your new password. The link you used no longer works.
        </p>

        <Link
          href="/login"
          className="ui-caps mt-6 inline-flex h-12 items-center rounded-md bg-cta px-6 text-sm text-cta-fg transition-colors hover:bg-cta-hover"
        >
          Log in
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="token" value={token} />

      <TextField
        id="password"
        name="password"
        type="password"
        label="New password"
        // "new-password" tells a password manager to offer to generate and
        // save one; "current-password" here would make it autofill the old.
        autoComplete="new-password"
        required
        minLength={8}
        hint="At least 8 characters."
      />

      <TextField
        id="confirm_password"
        name="confirm_password"
        type="password"
        label="Confirm new password"
        autoComplete="new-password"
        required
        minLength={8}
      />

      {state.error && (
        <FormError>
          {state.error}
          {state.expired && (
            <>
              {" "}
              <Link href="/forgot-password" className="font-semibold underline underline-offset-4">
                Send a new link
              </Link>
            </>
          )}
        </FormError>
      )}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Saving…" : "Set new password"}
      </Button>
    </form>
  );
}

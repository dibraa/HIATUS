"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Button, ButtonLink } from "@/components/ui/button";
import { PasswordField, FormError } from "@/components/ui/field";
import { updatePassword } from "@/app/actions/auth";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(updatePassword, {
    error: null,
    success: false,
  });

  if (state.success) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-lg border border-line bg-raised p-6 text-center"
      >
        <h2 className="display text-2xl text-ink">Password changed</h2>
        <p className="mx-auto mt-tight max-w-[42ch] text-sm text-muted">
          Log in with your new password. The link you used no longer works.
        </p>

        <ButtonLink href="/login" size="md" className="mt-stack w-full">
          Log in
        </ButtonLink>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />

      <PasswordField
        id="password"
        name="password"
        label="New password"
        // "new-password" tells a password manager to offer to generate and
        // save one; "current-password" here would make it autofill the old.
        autoComplete="new-password"
        required
        minLength={8}
        hint="At least 8 characters."
      />

      <PasswordField
        id="confirm_password"
        name="confirm_password"
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
              {/* Plain Link, not TextLink: it inherits the banner's danger
                  colour, which is the measured pair on this tint. */}
              <Link href="/forgot-password" className="font-semibold underline underline-offset-4">
                Send a new link
              </Link>
            </>
          )}
        </FormError>
      )}

      <Button type="submit" size="md" loading={pending} className="mt-1 w-full">
        {pending ? "Saving…" : "Set new password"}
      </Button>
    </form>
  );
}

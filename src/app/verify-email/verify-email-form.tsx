"use client";

import { useActionState } from "react";
import { verifyEmailToken } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/ui/field";
import { TextLink } from "@/components/ui/text-link";

export function VerifyEmailForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(verifyEmailToken, { error: null, verified: false });

  if (state.verified) {
    return (
      <div role="status" className="flex flex-col gap-3 rounded-lg border border-line bg-raised p-5">
        <h2 className="text-lg font-semibold text-ink">Email verified</h2>
        <p className="text-sm text-muted">Your email address is confirmed. You can now place orders.</p>
        <div className="flex gap-3">
          <TextLink href="/menu">Browse menu</TextLink>
          <TextLink href="/login">Log in</TextLink>
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      <p className="text-sm text-muted">Confirm your email address to activate ordering on your Hiatus account.</p>
      <FormError>{state.error}</FormError>
      <Button type="submit" loading={pending} disabled={!token}>
        {pending ? "Verifying…" : "Verify email address"}
      </Button>
      <TextLink href="/login" className="text-sm">Back to log in</TextLink>
    </form>
  );
}

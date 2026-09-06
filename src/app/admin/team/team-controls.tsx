"use client";

import { useActionState, useTransition } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import {
  TextField,
  SelectField,
  FormError,
  FormSuccess,
} from "@/components/ui/field";
import { grantRole, revokeRole, setAccountActive } from "@/app/actions/admin";
import type { TeamMember } from "@/types/database";

/**
 * Granting a role.
 *
 * Asks for an email that must already have an account, and says so up front —
 * because the alternative (silently failing on a typo, or worse, appearing to
 * create an account that does not exist) is the thing an admin would only
 * discover when the new barista could not log in.
 *
 * See the comment in actions/admin.ts for why accounts are not created here.
 */
export function GrantRoleForm() {
  const [state, formAction, pending] = useActionState(grantRole, {
    error: null,
    success: null,
  });

  return (
    <form action={formAction} className="rounded-lg border border-line bg-card p-5">
      <h2 className="display text-xl text-ink">Add someone to the team</h2>
      <p className="mt-1.5 text-sm text-muted">
        They need to have signed up through the app first. Enter the email they
        used and choose what they can do.
      </p>

      <div className="mt-4 flex flex-col gap-4">
        <TextField
          id="team-email"
          name="email"
          type="email"
          label="Email address"
          autoComplete="off"
          required
          placeholder="barista@example.com"
          hint="Must match an existing account."
        />

        <SelectField id="team-role" name="role" label="Role" defaultValue="staff">
          <option value="staff">Staff — queue, payments, availability</option>
          <option value="admin">Admin — everything, including the books</option>
        </SelectField>

        {state.error && <FormError>{state.error}</FormError>}
        {state.success && <FormSuccess>{state.success}</FormSuccess>}

        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Granting…" : "Grant access"}
        </Button>
      </div>
    </form>
  );
}

/**
 * Per-member controls.
 *
 * Deactivate is offered before remove, and worded as the reversible thing it
 * is. Removing a role is also non-destructive here — it demotes to customer
 * rather than deleting the account, so the person's own order history and the
 * shifts they worked survive. Nothing on this screen destroys a record.
 */
export function MemberControls({ member }: { member: TeamMember }) {
  const [pending, startTransition] = useTransition();

  function run(fn: () => Promise<{ error: string | null }>, success: string) {
    startTransition(async () => {
      const { error } = await fn();
      if (error) toast.error(error);
      else toast.success(success);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() =>
          run(
            () => setAccountActive(member.id, !member.is_active),
            member.is_active ? "Access suspended" : "Access restored"
          )
        }
      >
        {member.is_active ? "Suspend" : "Restore"}
      </Button>

      <Button
        size="sm"
        variant="danger"
        disabled={pending}
        onClick={() =>
          run(() => revokeRole(member.id), `${member.email} is now a customer`)
        }
      >
        Remove from team
      </Button>
    </div>
  );
}

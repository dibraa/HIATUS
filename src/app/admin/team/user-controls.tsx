"use client";
import { Permission, withPermission } from "@/components/permission-controls";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { SelectField, TextField } from "@/components/ui/field";
import { setAccountActive, updateStaffCredentials, updateUserRole } from "@/app/actions/admin";
import { AdminDialog as AccountDialog } from "@/components/admin-dialog";
import { InlineFormError as FormError } from "@/components/inline-form-error";
import { PhoneField } from "@/components/ui/phone-field";
import { ROLE_LABELS } from "@/lib/roles";
import type { Role, TeamMember } from "@/types/database";

type Account = Pick<TeamMember, "id" | "email" | "full_name" | "phone" | "role" | "is_active" | "on_shift">;
const ROLES: Role[] = ["admin", "staff", "customer"];

function UserRoleSelectContent({ member, isMe }: { member: Account; isMe: boolean }) {
  const [proposedRole, setProposedRole] = useState<Role | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const displayName = member.full_name?.trim() || member.email;

  function confirm() {
    if (!proposedRole || pending) return;
    setError(null);
    startTransition(async () => {
      try {
        const result = await updateUserRole(member.id, proposedRole);
        if (result.error) { setError(result.error); return; }
        toast.success(`${displayName} is now ${ROLE_LABELS[proposedRole]}.`);
        setProposedRole(null);
      } catch {
        setError("The role could not be updated. Try again.");
      }
    });
  }

  return (
    <>
      <SelectField
        id={`user-role-${member.id}`}
        label={`Role for ${member.email}`}
        hideLabel
        value={member.role}
        disabled={isMe || pending}
        hint={isMe ? "Your role cannot be changed here." : undefined}
        onChange={(event) => {
          const role = event.target.value as Role;
          if (role !== member.role) { setError(null); setProposedRole(role); }
        }}
      >
        {ROLES.map((role) => <option key={role} value={role}>{ROLE_LABELS[role]}</option>)}
      </SelectField>
      {proposedRole && (
        <AccountDialog
          title="Change role?"
          description={`Change ${displayName} from ${ROLE_LABELS[member.role]} to ${ROLE_LABELS[proposedRole]}? Custom permissions will reset to the new user type defaults.`}
          confirmation
          pending={pending}
          onClose={() => setProposedRole(null)}
        >
          <p className="text-sm text-ink-soft">
            {proposedRole === "admin" ? "Admins can manage all accounts, settings, and reports."
              : proposedRole === "staff" ? "Staff can manage orders, payments, and availability."
                : "Customer access removes permission to manage orders, payments, and administration."}
          </p>
          {!member.is_active && <p className="mt-3 text-sm text-muted">This account will remain suspended.</p>}
          {member.on_shift && proposedRole === "customer" && <p className="mt-3 text-sm text-warning-soft-fg">This user is on shift. They will lose counter access immediately.</p>}
          {error && <div className="mt-4"><FormError>{error}</FormError></div>}
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <Button variant="ghost" disabled={pending} onClick={() => setProposedRole(null)}>Cancel</Button>
            <Button disabled={pending} onClick={confirm}>{pending ? "Updating…" : "Confirm role change"}</Button>
          </div>
        </AccountDialog>
      )}
    </>
  );
}

function EditUserButtonContent({ member, isMe }: { member: Account; isMe: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="admin-team-action-btn" aria-label={`Edit account for ${member.email}`} onClick={() => setOpen(true)}>Edit</button>
      {open && <EditUserForm member={member} isMe={isMe} onClose={() => setOpen(false)} />}
    </>
  );
}

function EditUserForm({ member, isMe, onClose }: { member: Account; isMe: boolean; onClose: () => void }) {
  const router = useRouter();
  const [name, setName] = useState(member.full_name ?? "");
  const [email, setEmail] = useState(member.email);
  const [phone, setPhone] = useState(member.phone ?? "");
  const [password, setPassword] = useState("");
  const [confirmAccess, setConfirmAccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const displayName = member.full_name?.trim() || member.email;
  const changingSignIn = email.trim().toLowerCase() !== member.email || Boolean(password);

  function save() {
    if (pending) return;
    const data: Parameters<typeof updateStaffCredentials>[1] = {};
    if (name.trim() !== (member.full_name ?? "")) data.full_name = name.trim();
    if (email.trim().toLowerCase() !== member.email) data.email = email.trim().toLowerCase();
    if (phone.trim() !== (member.phone ?? "")) data.phone = phone.trim();
    if (password) data.password = password;
    if (!Object.keys(data).length) { onClose(); return; }
    setError(null);
    startTransition(async () => {
      try {
        const result = await updateStaffCredentials(member.id, data);
        if (result.error) { setError(result.error); return; }
        setPassword("");
        toast.success("Account updated.");
        onClose();
        if (isMe && changingSignIn) router.replace("/login?next=/admin/team");
      } catch {
        setError("The account could not be saved. Try again.");
      }
    });
  }

  function changeAccess() {
    if (pending) return;
    setError(null);
    startTransition(async () => {
      try {
        const result = await setAccountActive(member.id, !member.is_active);
        if (result.error) { setError(result.error); return; }
        toast.success(member.is_active ? "Account suspended." : "Account restored.");
        onClose();
      } catch {
        setError("Account access could not be updated. Try again.");
      }
    });
  }

  return (
    <AccountDialog
      title={confirmAccess ? (member.is_active ? "Suspend account?" : "Restore account?") : "Edit account"}
      description={confirmAccess
        ? (member.is_active ? `${displayName} will lose sign-in access. Their account and order history will be kept.` : `${displayName} will be able to sign in again.`)
        : `Update account details for ${displayName}.`}
      confirmation={confirmAccess}
      pending={pending}
      onClose={onClose}
    >
      {confirmAccess ? (
        <>
          {member.on_shift && member.is_active && <p className="mb-4 text-sm text-warning-soft-fg">This user is on shift. Suspending the account ends their access immediately.</p>}
          {error && <FormError>{error}</FormError>}
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            <Button variant="ghost" disabled={pending} onClick={() => { setError(null); setConfirmAccess(false); }}>Cancel</Button>
            <Button variant={member.is_active ? "danger" : "primary"} disabled={pending} onClick={changeAccess}>{pending ? "Updating…" : member.is_active ? "Suspend account" : "Restore account"}</Button>
          </div>
        </>
      ) : (
        <>
          <form onSubmit={(event) => { event.preventDefault(); save(); }}>
            <fieldset disabled={pending} className="grid min-w-0 gap-4 sm:grid-cols-2">
              <legend className="sr-only">Account credentials</legend>
              <TextField id={`user-name-${member.id}`} label="Name" value={name} onChange={(event) => setName(event.target.value)} required autoComplete="off" />
              <TextField id={`user-email-${member.id}`} label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="off" />
              <PhoneField id={`user-phone-${member.id}`} label="Phone number" value={phone} onValueChange={setPhone} autoComplete="off" />
              <TextField id={`user-password-${member.id}`} label="New password" type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} hint="Leave blank to keep the current password. Use at least 8 characters for a new password." autoComplete="new-password" />
              {changingSignIn && <p className="text-sm text-muted sm:col-span-2">{isMe ? "You will need to sign in again after changing your email or password." : "Changing the email or password signs this user out of existing sessions."}</p>}
              {error && <div className="sm:col-span-2"><FormError>{error}</FormError></div>}
              <div className="flex flex-wrap justify-end gap-2 sm:col-span-2">
                <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                <Button type="submit">{pending ? "Saving…" : "Save changes"}</Button>
              </div>
            </fieldset>
          </form>
          {!isMe && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
              <p className="text-sm text-muted">Account access: {member.is_active ? "Active" : "Suspended"}</p>
              <Permission name="users.status"><button type="button" disabled={pending} className="admin-team-action-btn" onClick={() => { setError(null); setConfirmAccess(true); }}>{member.is_active ? "Suspend account" : "Restore account"}</button></Permission>
            </div>
          )}
        </>
      )}
    </AccountDialog>
  );
}


export const UserRoleSelect = withPermission("users.roles", UserRoleSelectContent, true);

export const EditUserButton = withPermission("users.edit", EditUserButtonContent);

export function AccountStatusButton({ member, isMe }: { member: Account; isMe: boolean }) {
  const [open,setOpen] = useState(false), [pending,start] = useTransition();
  const [error,setError] = useState<string | null>(null);
  const router = useRouter();
  return <Permission name="users.status"><button type="button" className="admin-team-action-btn" disabled={isMe || pending} onClick={() => { setOpen(true);setError(null); }}>{member.is_active ? "Suspend" : "Reactivate"}</button>
    {open && <AccountDialog title={member.is_active ? "Suspend account?" : "Reactivate account?"} description={member.email + (member.is_active ? " will lose sign-in access. Account history will be kept." : " will be able to sign in again.")} confirmation pending={pending} onClose={() => setOpen(false)}>
      <FormError>{error}</FormError><div className="flex flex-wrap gap-3"><Button disabled={pending} loading={pending} onClick={() => start(async () => { const result = await setAccountActive(member.id,!member.is_active); if (result.error) setError(result.error); else { setOpen(false);router.refresh(); } })}>Confirm access change</Button><Button variant="ghost" disabled={pending} onClick={() => setOpen(false)}>Cancel</Button></div>
    </AccountDialog>}
  </Permission>;
}

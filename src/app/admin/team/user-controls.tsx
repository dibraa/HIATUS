"use client";

import { useEffect, useId, useRef, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { FormError, SelectField, TextField } from "@/components/ui/field";
import { deleteUserAccount, setAccountActive, updateStaffCredentials, updateUserRole } from "@/app/actions/admin";
import { PhoneField } from "@/components/ui/phone-field";
import { ROLE_LABELS } from "@/lib/roles";
import type { Role, TeamMember } from "@/types/database";

type Account = Pick<TeamMember, "id" | "email" | "full_name" | "phone" | "role" | "is_active" | "on_shift">;
const ROLES: Role[] = ["admin", "staff", "customer"];

function AccountDialog({ title, description, pending, onClose, children, confirmation = false }: {
  title: string;
  description: string;
  pending: boolean;
  onClose: () => void;
  children: ReactNode;
  confirmation?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();

  useEffect(() => {
    const dialog = ref.current;
    const trigger = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      if (trigger?.isConnected) trigger.focus();
    };
  }, []);

  useEffect(() => {
    ref.current?.querySelector<HTMLElement>("input:not([disabled]), button:not([disabled])")?.focus();
  }, [confirmation]);

  return (
    <dialog
      ref={ref}
      role={confirmation ? "alertdialog" : "dialog"}
      aria-modal="true"
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-description`}
      aria-busy={pending}
      className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl border border-line bg-card p-0 text-left text-ink backdrop:bg-scrim"
      onCancel={(event) => {
        event.preventDefault();
        if (!pending) onClose();
      }}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(
          'input:not(:disabled), button:not(:disabled), select:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])',
        )).filter((element) => element.getClientRects().length > 0);
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (!first) { event.preventDefault(); return; }
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !pending) {
          const bounds = event.currentTarget.getBoundingClientRect();
          if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
        }
      }}
    >
      <div className="p-6">
        <h2 id={`${id}-title`} className="display text-2xl text-ink">{title}</h2>
        <p id={`${id}-description`} className="mt-2 break-words text-sm text-muted">{description}</p>
        <div className="mt-5">{children}</div>
      </div>
    </dialog>
  );
}

export function UserRoleSelect({ member, isMe }: { member: Account; isMe: boolean }) {
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
          description={`Change ${displayName} from ${ROLE_LABELS[member.role]} to ${ROLE_LABELS[proposedRole]}?`}
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

export function EditUserButton({ member, isMe }: { member: Account; isMe: boolean }) {
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
              <button type="button" disabled={pending} className="admin-team-action-btn" onClick={() => { setError(null); setConfirmAccess(true); }}>{member.is_active ? "Suspend account" : "Restore account"}</button>
            </div>
          )}
        </>
      )}
    </AccountDialog>
  );
}

export function DeleteUserButton({ member, isMe }: { member: Account; isMe: boolean }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  return <>
    <button type="button" className="admin-team-action-btn admin-team-action-danger" disabled={isMe}
      title={isMe ? "You cannot delete your own active account." : undefined}
      aria-label={`Delete account for ${member.email}`} onClick={() => { setError(null); setOpen(true); }}>Delete</button>
    {open && <AccountDialog title="Permanently delete account?" description={`${member.full_name || "Unnamed account"} (${member.email})`} confirmation pending={pending} onClose={() => setOpen(false)}>
      <p className="text-sm text-ink-soft">This action cannot be undone. The sign-in account and personal preferences will be permanently deleted. Financial records and activity history will be retained without a link to the account.</p>
      {error && <div className="mt-4"><FormError>{error}</FormError></div>}
      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <Button variant="ghost" disabled={pending} onClick={() => setOpen(false)}>Cancel</Button>
        <Button variant="danger" disabled={pending} onClick={() => {
          if (pending) return;
          setError(null);
          startTransition(async () => {
            try {
              const result = await deleteUserAccount(member.id);
              if (result.error) { setError(result.error); return; }
              toast.success("Account permanently deleted.");
              setOpen(false);
            } catch { setError("The account could not be deleted. Try again."); }
          });
        }}>{pending ? "Deleting…" : "Confirm Delete"}</Button>
      </div>
    </AccountDialog>}
  </>;
}

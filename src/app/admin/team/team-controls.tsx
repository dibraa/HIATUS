"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import {
  TextField,
  SelectField,
  FormError,
  FormSuccess,
} from "@/components/ui/field";
import {
  createStaffAccount,
  grantRole,
  revokeRole,
  setAccountActive,
  updateStaffCredentials,
} from "@/app/actions/admin";
import type { TeamMember } from "@/types/database";
import { PhoneField } from "@/components/ui/phone-field";

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
export function GrantRoleDialog() {
  const [open, setOpen] = useState(false);
  const [formResetKey, setFormResetKey] = useState(0);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  function close() {
    setOpen(false);
    setFormResetKey((key) => key + 1);
    openButtonRef.current?.focus();
  }

  useEffect(() => {
    if (!open) return;
    firstFieldRef.current?.focus();
  }, [open, formResetKey]);

  function handleDialogKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape") {
      event.stopPropagation();
      close();
      return;
    }
    if (event.key !== "Tab" || !dialogRef.current) return;
    const focusable = Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((element) => element.offsetParent !== null);
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <>
      <button
        ref={openButtonRef}
        type="button"
        className="admin-secondary-link"
        aria-expanded={open}
        aria-controls="team-access-dialog"
        onClick={() => setOpen(true)}
      >
        Manage access
      </button>
      {open && (
        <div
          id="team-access-dialog"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={close}
        >
          <div
            className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
            aria-hidden="true"
          />
          <div
            key={formResetKey}
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="grant-access-title"
            className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-line bg-card p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={handleDialogKeyDown}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="grant-access-title" className="display text-2xl text-ink">
                  Manage access
                </h2>
                <p className="mt-1.5 text-sm text-muted">
                  Assign Staff or Admin access to an existing account.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close manage access dialog"
                onClick={close}
                className="flex min-h-11 min-w-11 items-center justify-center rounded-md text-muted hover:bg-raised hover:text-ink"
              >
                <CloseIcon />
              </button>
            </div>
            <div className="mt-5">
              <GrantRoleForm firstFieldRef={firstFieldRef} onClose={close} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function GrantRoleForm({
  firstFieldRef,
  onClose,
}: {
  firstFieldRef: React.RefObject<HTMLInputElement | null>;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(grantRole, {
    error: null,
    success: null,
  });

  return (
    <form
      action={formAction}
      className="text-left"
    >
      <div className="flex flex-col gap-4">
        <TextField
          ref={firstFieldRef}
          id="team-email"
          name="email"
          type="email"
          label="Email address"
          autoComplete="off"
          required
          placeholder="barista@example.com"
          hint="Must match an existing account."
        />

        <SelectField
          id="team-role"
          name="role"
          label="Role"
          defaultValue="staff"
        >
          <option value="staff">Staff — queue, payments, availability</option>
          <option value="admin">Admin — everything, including the books</option>
        </SelectField>

        {state.error && <FormError>{state.error}</FormError>}
        {state.success && <FormSuccess>{state.success}</FormSuccess>}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="md" disabled={pending}>
            {pending ? "Granting…" : "Grant access"}
          </Button>
        </div>
      </div>
    </form>
  );
}

export function AddToTeamRow({
  member,
}: {
  member: Pick<TeamMember, "email">;
}) {
  const [state, formAction, pending] = useActionState(grantRole, {
    error: null,
    success: null,
  });
  const [roleValue, setRoleValue] = useState("staff");
  const [confirmingAdmin, setConfirmingAdmin] = useState(false);
  const adminConfirmationRef = useRef<HTMLSpanElement>(null);
  const selectId = `add-role-${member.email.replace(/[^a-zA-Z0-9-_]/g, "-")}`;

  useEffect(() => {
    if (!confirmingAdmin) return;
    adminConfirmationRef.current?.querySelector<HTMLButtonElement>("button:not([disabled])")?.focus();
  }, [confirmingAdmin]);

  return (
    <div className="admin-team-inline-form">
      <form
        action={formAction}
        className="text-left"
        onSubmit={(event) => {
          if (roleValue === "admin" && !confirmingAdmin) {
            event.preventDefault();
            setConfirmingAdmin(true);
          }
        }}
      >
        <input type="hidden" name="email" value={member.email} />
        {confirmingAdmin && <input type="hidden" name="role" value={roleValue} />}
        {!confirmingAdmin ? (
          <span className="admin-team-add-row">
            <SelectField
              id={selectId}
              name="role"
              label={`Role for ${member.email}`}
              hideLabel
              className="h-11 w-28 shrink-0 bg-card px-3 text-sm"
              value={roleValue}
              onChange={(event) => {
                setRoleValue(event.target.value);
                setConfirmingAdmin(false);
              }}
            >
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </SelectField>
            <Button
              type="submit"
              size="md"
              disabled={pending}
              className="shrink-0 whitespace-nowrap"
            >
              {pending ? "Adding…" : "Add to team"}
            </Button>
          </span>
        ) : (
          <span ref={adminConfirmationRef} className="flex flex-col gap-2">
            <span className="text-xs font-medium text-ink">
              Grant Admin — including the books — to {member.email}?
            </span>
            <span className="flex gap-2">
              <Button
                type="submit"
                size="sm"
                disabled={pending}
                className="whitespace-nowrap"
              >
                {pending ? "Adding…" : "Grant admin"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setConfirmingAdmin(false)}
              >
                Cancel
              </Button>
            </span>
          </span>
        )}
        {state.error && (
          <span role="alert" className="mt-2 block text-xs text-danger">
            {state.error}
          </span>
        )}
        {state.success && (
          <span
            aria-live="polite"
            className="mt-2 block text-xs text-success"
          >
            {state.success}
          </span>
        )}
      </form>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 fill-none stroke-current"
      strokeWidth="1.8"
    >
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}

export function CreateStaffForm() {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [state, formAction, pending] = useActionState(createStaffAccount, {
    error: null,
    success: null,
  });
  const [lastEmail, setLastEmail] = useState<string | null>(null);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLFormElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const [formResetKey, setFormResetKey] = useState(0);

  function close() {
    if (pending) return;
    setOpen(false);
    setLastEmail(null);
    setPhone("");
    openButtonRef.current?.focus();
  }

  useEffect(() => {
    if (!open) return;
    firstFieldRef.current?.focus();
  }, [open, formResetKey]);

  useEffect(() => {
    if (open && state.success) {
      firstFieldRef.current?.focus();
    }
  }, [open, state.success]);

  function handleDialogKeyDown(event: React.KeyboardEvent) {
    if (event.key === "Escape") {
      event.stopPropagation();
      close();
      return;
    }
    if (event.key !== "Tab" || !dialogRef.current) return;
    const focusable = Array.from(
      dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((el) => el.offsetParent !== null);
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <>
      <Button ref={openButtonRef} size="md" onClick={() => setOpen(true)}>
        Create account
      </Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
            aria-hidden="true"
          />
          <form
            key={formResetKey}
            action={formAction}
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-account-title"
            className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-line bg-card p-6 shadow-xl"
            onKeyDown={handleDialogKeyDown}
            onSubmit={(event) => {
              const data = new FormData(event.currentTarget);
              setLastEmail(String(data.get("email") ?? ""));
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="create-account-title"
                  className="display text-2xl text-ink"
                >
                  Create account
                </h2>
                <p className="mt-1.5 text-sm text-muted">
                  Create login credentials for a customer, staff member, or
                  administrator.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close create account dialog"
                onClick={close}
                className="flex min-h-11 min-w-11 items-center justify-center rounded-md text-muted hover:bg-raised hover:text-ink"
              >
                <CloseIcon />
              </button>
            </div>
            {!pending && state.success && lastEmail ? (
              <div className="mt-5 flex flex-col gap-4">
                <FormSuccess>
                  Account created for {lastEmail}.
                </FormSuccess>
                {state.warning ? <FormError>{state.warning}</FormError> : <p className="text-sm text-muted">A one-time setup link was sent by email so they can choose their own password.</p>}
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setFormResetKey((key) => key + 1);
                      setLastEmail(null);
                      setPhone("");
                    }}
                  >
                    Create another
                  </Button>
                  <Button type="button" onClick={close}>
                    Done
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-5 flex flex-col gap-4">
                <TextField
                  ref={firstFieldRef}
                  id="new-staff-name"
                  name="full_name"
                  label="Full name"
                  maxLength={120}
                  required
                  autoComplete="off"
                />
                <TextField
                  id="new-staff-email"
                  name="email"
                  type="email"
                  label="Email address"
                  maxLength={254}
                  required
                  autoComplete="off"
                />
                <PhoneField
                  id="new-staff-phone"
                  name="phone"
                  label="Phone"
                  value={phone}
                  onValueChange={setPhone}
                  autoComplete="off"
                />
                <p className="text-sm text-muted">The user will receive a one-time email link to choose their own password.</p>
                <SelectField
                  id="new-staff-role"
                  name="role"
                  label="Role"
                  defaultValue="staff"
                >
                  <option value="customer">Customer</option>
                  <option value="staff">
                    Staff — queue, payments, availability
                  </option>
                  <option value="admin">
                    Admin — everything, including the books
                  </option>
                </SelectField>
                {state.error && <FormError>{state.error}</FormError>}
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="ghost" onClick={close}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={pending}>
                    {pending ? "Creating…" : "Create account"}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </div>
      )}
    </>
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
  const [editError, setEditError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState<null | "suspend" | "remove">(
    null,
  );
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(member.full_name ?? "");
  const [email, setEmail] = useState(member.email);
  const [phone, setPhone] = useState(member.phone ?? "");
  const [password, setPassword] = useState("");
  const editFirstFieldRef = useRef<HTMLInputElement>(null);
  const editDialogRef = useRef<HTMLDialogElement>(null);
  const confirmationRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!confirming) return;
    confirmationRef.current?.querySelector<HTMLButtonElement>("button:not([disabled])")?.focus();
  }, [confirming]);

  useEffect(() => {
    if (!editing) return;
    const dialog = editDialogRef.current;
    dialog?.showModal();
    editFirstFieldRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [editing]);

  function run(
    fn: () => Promise<{ error: string | null }>,
    success: string,
    onSuccess?: () => void,
  ) {
    startTransition(async () => {
      const { error } = await fn();
      if (error) {
        setEditError(error);
        toast.error(error);
      } else {
        setEditError(null);
        toast.success(success);
        setConfirming(null);
        onSuccess?.();
      }
    });
  }

  const displayName = member.full_name?.trim() || member.email;

  return (
    <div className="admin-team-inline-actions">
      {confirming === null && (
        <>
          <button
            type="button"
            disabled={pending}
            onClick={() => setConfirming("suspend")}
            className="admin-team-action-btn"
          >
            {member.is_active ? "Suspend" : "Restore"}
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => setEditing(true)}
            className="admin-team-action-btn"
          >
            Edit
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => setConfirming("remove")}
            className="admin-team-action-btn admin-team-action-danger"
          >
            Remove
          </button>
        </>
      )}
      {confirming === "suspend" && (
        <span
          ref={confirmationRef}
          className="flex basis-full flex-col gap-1.5 rounded-md border border-warning/40 bg-card p-2.5 text-left"
          role="alertdialog"
          aria-label={
            member.is_active ? "Confirm suspension" : "Confirm restore"
          }
        >
          <span className="text-xs font-medium text-ink">
            {member.is_active ? (
              <>
                Suspend {displayName}? They lose counter access immediately.
                This is reversible.
              </>
            ) : (
              <>Restore {displayName} to the team?</>
            )}
          </span>
          {member.is_active && member.on_shift && (
            <span className="text-xs font-medium text-warning-soft-fg">
              {displayName} is on shift right now — suspending locks them out
              mid-queue.
            </span>
          )}
          <span className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={pending}
              onClick={() =>
                run(
                  () => setAccountActive(member.id, !member.is_active),
                  member.is_active ? "Access suspended" : "Access restored",
                )
              }
            >
              {pending ? "Working…" : member.is_active ? "Suspend" : "Restore"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={pending}
              onClick={() => setConfirming(null)}
            >
              Cancel
            </Button>
          </span>
        </span>
      )}
      {confirming === "remove" && (
        <span
          ref={confirmationRef}
          className="flex basis-full flex-col gap-1.5 rounded-md border border-danger/40 bg-card p-2.5 text-left"
          role="alertdialog"
          aria-label="Confirm removal from team"
        >
          <span className="text-xs font-medium text-ink">
            Remove {displayName} from the team? They become a customer and keep
            their history, but lose counter and books access.
          </span>
          <span className="flex gap-2">
            <Button
              size="sm"
              variant="danger"
              disabled={pending}
              onClick={() =>
                run(
                  () => revokeRole(member.id),
                  `${member.email} is now a customer`,
                )
              }
            >
              {pending ? "Working…" : "Remove"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={pending}
              onClick={() => setConfirming(null)}
            >
              Cancel
            </Button>
          </span>
        </span>
      )}
      {editing && (
        <dialog
          ref={editDialogRef}
          aria-labelledby={`edit-credentials-title-${member.id}`}
          className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-2xl border border-line bg-card p-0 text-ink backdrop:bg-scrim"
          onCancel={(event) => {
            event.preventDefault();
            if (!pending) setEditing(false);
          }}
        >
          <form
            className="relative w-full p-6 text-left"
            onClick={(event) => event.stopPropagation()}
            onSubmit={(event) => {
              event.preventDefault();
              run(
                () =>
                  updateStaffCredentials(member.id, {
                    full_name: name,
                    email,
                    phone,
                    password,
                  }),
                "Credentials updated",
                () => {
                  setPassword("");
                  setEditing(false);
                },
              );
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id={`edit-credentials-title-${member.id}`}
                  className="display text-2xl text-ink"
                >
                  Edit credentials
                </h2>
                <p className="mt-1.5 text-sm text-muted">
                  Update account details for {displayName}.
                </p>
              </div>
              <button
                type="button"
                aria-label="Close edit credentials dialog"
                disabled={pending}
                onClick={() => setEditing(false)}
                className="flex min-h-11 min-w-11 items-center justify-center rounded-md text-muted hover:bg-raised hover:text-ink"
              >
                <CloseIcon />
              </button>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {editError && (
                <div className="sm:col-span-2">
                  <FormError>{editError}</FormError>
                </div>
              )}
              <TextField
                ref={editFirstFieldRef}
                id={`edit-name-${member.id}`}
                disabled={pending}
                label="Name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                autoComplete="off"
              />
              <TextField
                id={`edit-email-${member.id}`}
                disabled={pending}
                label="Email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="off"
              />
              <PhoneField
                id={`edit-phone-${member.id}`}
                disabled={pending}
                label="Phone"
                value={phone}
                onValueChange={setPhone}
                autoComplete="off"
              />
              <TextField
                id={`edit-password-${member.id}`}
                disabled={pending}
                label="New password"
                type="password"
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Leave blank to keep current"
                hint="At least 8 characters when changing."
                autoComplete="new-password"
              />
              <div className="flex justify-end gap-2 sm:col-span-2">
                <Button
                  type="button"
                  variant="ghost"
                  disabled={pending}
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={pending}>
                  {pending ? "Saving…" : "Save credentials"}
                </Button>
              </div>
            </div>
          </form>
        </dialog>
      )}
    </div>
  );
}

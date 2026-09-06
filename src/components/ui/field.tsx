"use client";

import { useState, type ComponentProps, type ReactNode } from "react";

/**
 * Form primitives.
 *
 * Every form in the app (auth, profile, admin menu, ratings) previously
 * repeated the same label + input markup with its own hardcoded stone classes,
 * which is how they drifted apart. These are the one implementation.
 *
 * The accessibility wiring is the point, not the styling:
 *   - the label is always a real <label htmlFor>, never a floating <p>;
 *   - a hint and an error are linked to the control through aria-describedby,
 *     so a screen reader reads "Password, edit text, At least 8 characters"
 *     rather than leaving the hint stranded next to the field;
 *   - an error sets aria-invalid AND renders text, so the failure is never
 *     carried by the red border alone (WCAG 1.4.1);
 *   - the border is --hi-line-strong (3:1), not the decorative --hi-line,
 *     because an input's edge IS its affordance (WCAG 1.4.11).
 */

/** Shared control skin. Single-line by deliberate choice: a multi-line string
 *  literal in a className carries the CR from a CRLF file into the server HTML
 *  but not the client, which produces a hydration mismatch. */
const CONTROL = "w-full rounded-md border border-line-strong bg-card px-3 py-2.5 text-sm text-ink transition-colors placeholder:text-muted hover:border-ink-soft focus:border-ink disabled:cursor-not-allowed disabled:bg-raised disabled:text-muted";

const CONTROL_INVALID = "border-danger hover:border-danger focus:border-danger";

function controlClasses(invalid: boolean, className?: string) {
  return [CONTROL, invalid ? CONTROL_INVALID : "", className].filter(Boolean).join(" ");
}

type FieldShellProps = {
  id: string;
  label: string;
  hint?: string;
  error?: string | null;
  /** Visually hides the label while leaving it in the accessibility tree. */
  hideLabel?: boolean;
  children: ReactNode;
};

/** Label + control + hint/error stack. Exported for controls these helpers
 *  don't cover (a file input, a read-only mirror of an account email). */
export function Field({ id, label, hint, error, hideLabel, children }: FieldShellProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {/* Tracked mono caps, like every other label in the system. A field label
          is chrome, not prose — it names the control rather than being read. */}
      <label
        htmlFor={id}
        className={hideLabel ? "sr-only" : "ui-caps text-2xs text-ink-soft"}
      >
        {label}
      </label>

      {children}

      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      )}

      {/* role="alert" so a validation failure is announced when it appears,
          rather than only being found by someone who tabs back through. */}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

/** Builds the aria-describedby list, omitting it entirely when empty — an
 *  empty describedby is worse than none, it points at nothing. */
function describedBy(id: string, hint?: string, error?: string | null) {
  const ids = [hint && !error ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean);
  return ids.length ? ids.join(" ") : undefined;
}

type TextFieldProps = Omit<ComponentProps<"input">, "id"> & {
  id: string;
  label: string;
  hint?: string;
  error?: string | null;
  hideLabel?: boolean;
};

export function TextField({
  id,
  label,
  hint,
  error,
  hideLabel,
  className,
  ...props
}: TextFieldProps) {
  return (
    <Field id={id} label={label} hint={hint} error={error} hideLabel={hideLabel}>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={controlClasses(Boolean(error), className)}
        {...props}
      />
    </Field>
  );
}

type PasswordFieldProps = Omit<ComponentProps<"input">, "id" | "type"> & {
  id: string;
  label: string;
  hint?: string;
  error?: string | null;
  hideLabel?: boolean;
};

export function PasswordField({
  id,
  label,
  hint,
  error,
  hideLabel,
  className,
  ...props
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <Field id={id} label={label} hint={hint} error={error} hideLabel={hideLabel}>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, hint, error)}
          className={controlClasses(Boolean(error), ["pr-11", className].filter(Boolean).join(" "))}
          {...props}
        />
        <button
          type="button"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          title={visible ? "Hide password" : "Show password"}
          onClick={() => setVisible((current) => !current)}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted transition-colors duration-150 ease-hi hover:text-ink focus-visible:text-ink"
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    </Field>
  );
}

function EyeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8">
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8">
      <path d="m3 3 18 18" />
      <path d="M10.6 6.2A10.7 10.7 0 0 1 12 6c6 0 9.5 6 9.5 6a17.4 17.4 0 0 1-3.2 3.8M6.2 6.9C3.9 8.5 2.5 12 2.5 12s3.5 6 9.5 6a9.7 9.7 0 0 0 3.2-.5" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  );
}

type TextAreaFieldProps = Omit<ComponentProps<"textarea">, "id"> & {
  id: string;
  label: string;
  hint?: string;
  error?: string | null;
  hideLabel?: boolean;
};

export function TextAreaField({
  id,
  label,
  hint,
  error,
  hideLabel,
  className,
  ...props
}: TextAreaFieldProps) {
  return (
    <Field id={id} label={label} hint={hint} error={error} hideLabel={hideLabel}>
      <textarea
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={controlClasses(Boolean(error), className)}
        {...props}
      />
    </Field>
  );
}

type SelectFieldProps = Omit<ComponentProps<"select">, "id"> & {
  id: string;
  label: string;
  hint?: string;
  error?: string | null;
  hideLabel?: boolean;
};

export function SelectField({
  id,
  label,
  hint,
  error,
  hideLabel,
  className,
  children,
  ...props
}: SelectFieldProps) {
  return (
    <Field id={id} label={label} hint={hint} error={error} hideLabel={hideLabel}>
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
        className={controlClasses(Boolean(error), className)}
        {...props}
      >
        {children}
      </select>
    </Field>
  );
}

type CheckboxFieldProps = Omit<ComponentProps<"input">, "id" | "type"> & {
  id: string;
  label: string;
  hint?: string;
};

/** Checkbox reverses the stack — the box precedes its label, and the whole row
 *  is the hit target rather than just the 16px box. */
export function CheckboxField({ id, label, hint, className, ...props }: CheckboxFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="flex items-center gap-2.5 text-sm font-medium text-ink-soft">
        <input
          id={id}
          type="checkbox"
          aria-describedby={hint ? `${id}-hint` : undefined}
          className={["h-4 w-4 shrink-0 accent-[var(--hi-accent)]", className].filter(Boolean).join(" ")}
          {...props}
        />
        {label}
      </label>
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}

/**
 * Form-level error — the one a server action returns for the submission as a
 * whole ("Invalid login credentials"), which belongs to no single field.
 */
export function FormError({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p
      role="alert"
      className="rounded-md border border-danger/40 bg-danger-soft-bg px-3 py-2.5 text-sm font-medium text-danger-soft-fg"
    >
      {children}
    </p>
  );
}

/** Its success counterpart. aria-live rather than role="alert": a save
 *  confirmation is polite news, it should not interrupt what is being read. */
export function FormSuccess({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p
      aria-live="polite"
      className="rounded-md border border-success/40 bg-success-soft-bg px-3 py-2.5 text-sm font-medium text-success-soft-fg"
    >
      {children}
    </p>
  );
}

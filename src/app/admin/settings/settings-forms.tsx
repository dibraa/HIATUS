"use client";
import { withPermission } from "@/components/permission-controls";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  TextField,
  TextAreaField,
  CheckboxField,
  FormError,
  FormSuccess,
} from "@/components/ui/field";
import {
  saveBusinessHours,
  saveNotificationTemplates,
  saveOrderingSettings,
  saveShopInfo,
  type SettingsState,
} from "@/app/actions/settings";
import type {
  BusinessHours,
  NotificationTemplates,
  OrderingSettings,
  ShopInfo,
} from "@/types/database";

const INITIAL: SettingsState = { error: null, success: null };

/**
 * Each settings card owns exactly one `app_settings` key and one action.
 *
 * Five separate forms rather than one big save button: saving the opening
 * hours should not rewrite the payment methods, and a single form would send
 * every value on every submit — so two admins editing two sections in two tabs
 * would silently overwrite each other. One key per form makes that impossible.
 */
function SettingsCard({
  title,
  description,
  state,
  pending,
  action,
  children,
  submitLabel = "Save",
  version = 0,
}: {
  title: string;
  description: string;
  state: SettingsState;
  pending: boolean;
  action: (formData: FormData) => void;
  children: React.ReactNode;
  submitLabel?: string;
  version?: number;
}) {
  return (
    <form action={action} onReset={event => event.preventDefault()} className="admin-settings-card">
      <input type="hidden" name="version" value={state.version ?? version} />
      <h2 className="display text-xl text-ink">{title}</h2>
      <p className="mt-1.5 max-w-[60ch] text-sm text-muted">{description}</p>

      <div className="mt-5 flex flex-col gap-4">{children}</div>

      {state.error && (
        <div className="mt-4">
          <FormError>{state.error}</FormError>
        </div>
      )}
      {state.success && (
        <div className="mt-4">
          <FormSuccess>{state.success}</FormSuccess>
        </div>
      )}

      <Button type="submit" className="mt-5" disabled={pending}>
        {pending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}

/* ==========================================================================
   Business hours
   ========================================================================== */

function BusinessHoursFormContent({ hours, version = 0 }: { hours: BusinessHours[]; version?: number }) {
  const [draft, setDraft] = useState(hours);
  const [state, formAction, pending] = useActionState(saveBusinessHours, INITIAL);

  return (
    <SettingsCard
      version={version}
      submitLabel="Save hours"
      title="Opening hours"
      description="Manila time. Earlier closing times continue into the next day."
      state={state}
      pending={pending}
      action={formAction}
    >
      <div className="flex flex-col gap-3">
        {draft.map((day) => (
          <div
            key={day.day}
            className="admin-hours-row"
          >
            <span className="w-24 shrink-0 text-sm font-medium text-ink">
              {day.label}
            </span>

            <label className="flex items-center gap-1.5 text-xs text-muted">
              <span className="sr-only">{day.label} opening time</span>
              <input
                type="time"
                name={`open-${day.day}`}
                value={day.open}
                disabled={day.closed}
                onChange={event => setDraft(rows => rows.map(row => row.day === day.day ? { ...row, open: event.target.value } : row))}
                className="rounded-md border border-line-strong bg-card px-2 py-1.5 text-sm numeric text-ink"
              />
            </label>

            <span aria-hidden="true" className="text-muted">
              &ndash;
            </span>

            <label className="flex items-center gap-1.5 text-xs text-muted">
              <span className="sr-only">{day.label} closing time</span>
              <input
                type="time"
                name={`close-${day.day}`}
                value={day.close}
                disabled={day.closed}
                onChange={event => setDraft(rows => rows.map(row => row.day === day.day ? { ...row, close: event.target.value } : row))}
                className="rounded-md border border-line-strong bg-card px-2 py-1.5 text-sm numeric text-ink"
              />
            </label>

            <label className="ml-auto flex items-center gap-2 text-sm text-ink-soft">
              <input
                type="checkbox"
                name={`closed-${day.day}`}
                checked={day.closed}
                onChange={event => setDraft(rows => rows.map(row => row.day === day.day ? { ...row, closed: event.target.checked } : row))}
                className="h-4 w-4 accent-[var(--hi-accent)]"
              />
              Closed
            </label>
            {day.closed && <><input type="hidden" name={`open-${day.day}`} value={day.open} /><input type="hidden" name={`close-${day.day}`} value={day.close} /></>}
            {!day.closed && day.close < day.open && <span className="text-xs text-muted">Next day</span>}
            {!day.closed && day.open === day.close && <span role="alert" className="text-xs text-danger">Choose different times.</span>}
          </div>
        ))}
      </div>
    </SettingsCard>
  );
}

/* ==========================================================================
   Payment methods
   ========================================================================== */

export function PaymentMethodsForm() {
  return <section className="admin-panel"><h2 className="text-lg font-semibold text-ink">Payment method</h2><p className="mt-3 text-sm text-ink">Cash</p><p className="mt-1 text-sm text-muted">Payment is collected at the counter.</p></section>;
}

/* ==========================================================================
   Ordering
   ========================================================================== */

function OrderingFormContent({ ordering, version = 0 }: { ordering: OrderingSettings; version?: number }) {
  const [state, formAction, pending] = useActionState(saveOrderingSettings, INITIAL);

  return (
    <SettingsCard
      title="Ordering"
      version={version}
      description="Pausing orders blocks checkout. The menu remains visible."
      state={state}
      pending={pending}
      action={formAction}
    >
      <CheckboxField
        id="accepting_orders"
        name="accepting_orders"
        label="Accepting orders"
        defaultChecked={ordering.accepting_orders}
      />
      <CheckboxField
        id="dine_in_enabled"
        name="dine_in_enabled"
        label="Offer dine-in"
        defaultChecked={ordering.dine_in_enabled}
      />
      <CheckboxField
        id="takeout_enabled"
        name="takeout_enabled"
        label="Offer takeout"
        defaultChecked={ordering.takeout_enabled}
      />

      <TextField
        id="default_prep_minutes"
        name="default_prep_minutes"
        label="Fallback prep time (minutes)"
        type="number"
        min="1"
        max="120"
        step="1"
        defaultValue={ordering.default_prep_minutes}
        hint="Used until order history provides a measured wait."
      />
    </SettingsCard>
  );
}

/* ==========================================================================
   Shop details
   ========================================================================== */

function ShopInfoFormContent({ info, version = 0 }: { info: ShopInfo; version?: number }) {
  const [state, formAction, pending] = useActionState(saveShopInfo, INITIAL);

  return (
    <SettingsCard
      title="Shop details"
      version={version}
      description="Appears in the footer and on receipts."
      state={state}
      pending={pending}
      action={formAction}
    >
      <TextField id="name" name="name" label="Shop name" defaultValue={info.name} required />
      <TextField
        id="tagline"
        name="tagline"
        label="Tagline"
        defaultValue={info.tagline}
        placeholder="Slow moments, served warm."
      />
      <TextField
        id="address"
        name="address"
        label="Address"
        defaultValue={info.address}
        placeholder="123 Example St, Manila"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          id="phone"
          name="phone"
          label="Phone"
          type="tel"
          defaultValue={info.phone}
        />
        <TextField
          id="email"
          name="email"
          label="Email"
          type="email"
          defaultValue={info.email}
        />
      </div>
    </SettingsCard>
  );
}

/* ==========================================================================
   Notification wording
   ========================================================================== */

function TemplatesFormContent({ templates }: { templates: NotificationTemplates }) {
  const [state, formAction, pending] = useActionState(
    saveNotificationTemplates,
    INITIAL
  );

  return (
    <SettingsCard
      title="Order messages"
      description="Shown on the customer’s order page at each stage."
      state={state}
      pending={pending}
      action={formAction}
    >
      <TextAreaField
        id="order_accepted"
        name="order_accepted"
        label="When the order is received"
        rows={2}
        defaultValue={templates.order_accepted}
        required
      />
      <TextAreaField
        id="order_preparing"
        name="order_preparing"
        label="While it is being made"
        rows={2}
        defaultValue={templates.order_preparing}
        required
      />
      <TextAreaField
        id="order_ready"
        name="order_ready"
        label="When it is ready"
        rows={2}
        defaultValue={templates.order_ready}
        required
      />
      <TextAreaField
        id="order_completed"
        name="order_completed"
        label="After it is collected"
        rows={2}
        defaultValue={templates.order_completed}
        required
      />
    </SettingsCard>
  );
}

export const BusinessHoursForm = withPermission("settings.edit", BusinessHoursFormContent, true);

export const OrderingForm = withPermission("settings.edit", OrderingFormContent, true);

export const ShopInfoForm = withPermission("settings.edit", ShopInfoFormContent, true);

export const TemplatesForm = withPermission("settings.edit", TemplatesFormContent, true);

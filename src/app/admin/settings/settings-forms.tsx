"use client";

import { useActionState } from "react";
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
  savePaymentMethods,
  saveShopInfo,
  type SettingsState,
} from "@/app/actions/settings";
import type {
  BusinessHours,
  NotificationTemplates,
  OrderingSettings,
  PaymentMethodSettings,
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
}: {
  title: string;
  description: string;
  state: SettingsState;
  pending: boolean;
  action: (formData: FormData) => void;
  children: React.ReactNode;
  submitLabel?: string;
}) {
  return (
    <form action={action} className="rounded-lg border border-line bg-card p-5">
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

export function BusinessHoursForm({ hours }: { hours: BusinessHours[] }) {
  const [state, formAction, pending] = useActionState(saveBusinessHours, INITIAL);

  return (
    <SettingsCard
      title="Opening hours"
      description="Shown on the storefront. A closing time earlier than the opening time is read as running past midnight."
      state={state}
      pending={pending}
      action={formAction}
    >
      <div className="flex flex-col gap-3">
        {hours.map((day) => (
          <div
            key={day.day}
            className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-line pb-3 last:border-0 last:pb-0"
          >
            <span className="w-24 shrink-0 text-sm font-medium text-ink">
              {day.label}
            </span>

            <label className="flex items-center gap-1.5 text-xs text-muted">
              <span className="sr-only">{day.label} opening time</span>
              <input
                type="time"
                name={`open-${day.day}`}
                defaultValue={day.open}
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
                defaultValue={day.close}
                className="rounded-md border border-line-strong bg-card px-2 py-1.5 text-sm numeric text-ink"
              />
            </label>

            <label className="ml-auto flex items-center gap-2 text-sm text-ink-soft">
              <input
                type="checkbox"
                name={`closed-${day.day}`}
                defaultChecked={day.closed}
                className="h-4 w-4 accent-[var(--hi-accent)]"
              />
              Closed
            </label>
          </div>
        ))}
      </div>
    </SettingsCard>
  );
}

/* ==========================================================================
   Payment methods
   ========================================================================== */

export function PaymentMethodsForm({ methods }: { methods: PaymentMethodSettings }) {
  const [state, formAction, pending] = useActionState(savePaymentMethods, INITIAL);

  return (
    <SettingsCard
      title="Payment methods"
      description="Which tenders customers can choose at checkout. Payment is still taken at the counter — this app does not process cards itself."
      state={state}
      pending={pending}
      action={formAction}
    >
      <CheckboxField
        id="cash"
        name="cash"
        label="Cash"
        defaultChecked={methods.cash}
        hint="Paid at the counter on collection."
      />
      <CheckboxField
        id="card"
        name="card"
        label="Card"
        defaultChecked={methods.card}
        hint="Tapped or inserted on your own terminal."
      />
      <CheckboxField
        id="ewallet"
        name="ewallet"
        label="E-wallet"
        defaultChecked={methods.ewallet}
        hint="GCash, Maya or a QR wallet at the counter."
      />
    </SettingsCard>
  );
}

/* ==========================================================================
   Ordering
   ========================================================================== */

export function OrderingForm({ ordering }: { ordering: OrderingSettings }) {
  const [state, formAction, pending] = useActionState(saveOrderingSettings, INITIAL);

  return (
    <SettingsCard
      title="Ordering"
      description="Controls what the storefront offers. Switching orders off leaves the menu browsable but stops new checkouts."
      state={state}
      pending={pending}
      action={formAction}
    >
      <CheckboxField
        id="accepting_orders"
        name="accepting_orders"
        label="Accepting orders"
        defaultChecked={ordering.accepting_orders}
        hint="Turn off during a rush or after closing."
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
        hint="Only used until there is enough order history to measure the real wait."
      />
    </SettingsCard>
  );
}

/* ==========================================================================
   Shop details
   ========================================================================== */

export function ShopInfoForm({ info }: { info: ShopInfo }) {
  const [state, formAction, pending] = useActionState(saveShopInfo, INITIAL);

  return (
    <SettingsCard
      title="Shop details"
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

export function TemplatesForm({ templates }: { templates: NotificationTemplates }) {
  const [state, formAction, pending] = useActionState(
    saveNotificationTemplates,
    INITIAL
  );

  return (
    <SettingsCard
      title="Order messages"
      description="What a customer reads on their order page at each stage. Keep it warm and plain — no jargon."
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

"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { CheckboxField, FormError, FormSuccess } from "@/components/ui/field";
import { PushToggle } from "@/components/push-toggle";
import { saveNotificationPreferences } from "@/app/actions/account";
import type { NotificationPreferences } from "@/types/database";

/**
 * Notification preferences.
 *
 * Split into WHAT (which events are worth telling you about) and HOW (which
 * channel), because those are genuinely separate choices. The WHAT switches
 * drive every channel at once: on-site alerts and browser push both read
 * them through shouldAlert().
 *
 * HOW lists only channels that actually deliver. Email is shown as coming
 * rather than as a checkbox, and SMS is not shown at all: a switch for a
 * message that is never sent is worse than no switch. Their stored values
 * are passed through untouched so nothing on the server changes meaning.
 *
 * Browser notifications are per device and act immediately (the permission
 * prompt must happen inside the click), so they sit inside the HOW list
 * but outside the Save button's reach.
 */
export function NotificationForm({ prefs }: { prefs: NotificationPreferences | null }) {
  const [state, formAction, pending] = useActionState(saveNotificationPreferences, {
    error: null,
    success: false,
  });

  // A customer who has never opened this screen has no row. Absent is read as
  // "all defaults" rather than as "everything off".
  const p = prefs ?? {
    order_updates: true,
    ready_alerts: true,
    email_channel: true,
    sms_channel: false,
  };

  return (
    <div className="flex flex-col gap-5">
      <form id="notification-prefs" action={formAction} className="flex flex-col gap-5">
        {/* Not editable here (no channel sends them yet), but the action
            saves every field, so they travel as they are. */}
        <input type="hidden" name="email_channel" value={p.email_channel ? "on" : ""} />
        <input type="hidden" name="sms_channel" value={p.sms_channel ? "on" : ""} />

        <fieldset className="flex flex-col gap-1">
          <legend className="mb-1 text-sm font-semibold text-ink">What to tell you about</legend>

          <CheckboxField
            id="ready_alerts"
            name="ready_alerts"
            label="Ready for pickup"
            hint="When your order is on the counter."
            defaultChecked={p.ready_alerts}
          />
          <CheckboxField
            id="order_updates"
            name="order_updates"
            label="Order progress"
            hint="When we accept your order and start making it."
            defaultChecked={p.order_updates}
          />
        </fieldset>
      </form>

      <section aria-labelledby="channels-heading" className="flex flex-col gap-3 border-t border-line pt-5">
        <h3 id="channels-heading" className="text-sm font-semibold text-ink">How we tell you</h3>

        <div className="flex items-start gap-2.5">
          <svg viewBox="0 0 16 16" className="mt-0.5 h-4 w-4 shrink-0 text-success" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M3 8.5l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div>
            <p className="text-sm font-medium text-ink-soft">On this site</p>
            <p className="text-xs text-muted">A pop-up and a chime while your order page is open. Always on.</p>
          </div>
        </div>

        <PushToggle />

        <div className="flex items-start gap-2.5">
          <span aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 rounded-sm border border-line-strong" />
          <div>
            <p className="text-sm font-medium text-ink-soft">
              Email <span className="ml-1 rounded-sm bg-raised px-1.5 py-0.5 text-2xs font-medium text-muted">Coming soon</span>
            </p>
            <p className="text-xs text-muted">We don&apos;t send order emails yet.</p>
          </div>
        </div>
      </section>

      {state.error && <FormError>{state.error}</FormError>}
      {state.success && <FormSuccess>Preferences saved.</FormSuccess>}

      <Button type="submit" form="notification-prefs" size="md" disabled={pending} className="self-start">
        {pending ? "Saving…" : "Save preferences"}
      </Button>
    </div>
  );
}

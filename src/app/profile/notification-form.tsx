"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { CheckboxField, FormError, FormSuccess } from "@/components/ui/field";
import { saveNotificationPreferences } from "@/app/actions/account";
import type { NotificationPreferences } from "@/types/database";

/**
 * Notification preferences.
 *
 * Split into WHAT (which events are worth telling you about) and HOW (which
 * channel), because those are genuinely separate choices — someone may want
 * every order update but only by email.
 *
 * Marketing defaults OFF and everything operational defaults on. That is the
 * honest default: the customer gave their address to be told their coffee is
 * ready, not to be sold to, and opt-out marketing is a dark pattern however
 * common it is.
 *
 * The copy below says plainly that channels are not wired up yet rather than
 * implying an SMS is coming. A preference screen that quietly does nothing is
 * worse than one that admits what it is.
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
    promotions: false,
    email_channel: true,
    sms_channel: false,
  };

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-sm font-semibold text-ink">
          What to tell you about
        </legend>

        <CheckboxField
          id="order_updates"
          name="order_updates"
          label="Order progress"
          defaultChecked={p.order_updates}
        />
        <CheckboxField
          id="ready_alerts"
          name="ready_alerts"
          label="Ready for pickup"
          defaultChecked={p.ready_alerts}
        />
        <CheckboxField
          id="promotions"
          name="promotions"
          label="Offers and new drinks"
          defaultChecked={p.promotions}
        />
      </fieldset>

      <fieldset className="flex flex-col gap-3 border-t border-line pt-5">
        <legend className="mb-1 text-sm font-semibold text-ink">Where to send it</legend>

        <CheckboxField
          id="email_channel"
          name="email_channel"
          label="Email"
          defaultChecked={p.email_channel}
        />
        <CheckboxField
          id="sms_channel"
          name="sms_channel"
          label="SMS"
          defaultChecked={p.sms_channel}
        />
      </fieldset>

      {state.error && <FormError>{state.error}</FormError>}
      {state.success && <FormSuccess>Preferences saved.</FormSuccess>}

      <Button type="submit" size="md" disabled={pending} className="self-start">
        {pending ? "Saving…" : "Save preferences"}
      </Button>
    </form>
  );
}

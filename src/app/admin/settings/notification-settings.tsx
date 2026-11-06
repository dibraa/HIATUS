"use client";
import { withPermission } from "@/components/permission-controls";
import { useActionState, useState } from "react";
import Link from "next/link";
import { saveNotifications } from "@/app/actions/settings";
import type { NotificationPolicy } from "@/lib/settings";
import type { OrderStatus } from "@/types/database";
import { CheckboxField, TextAreaField, FormError, FormSuccess } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
const events: [OrderStatus, string][] = [["pending", "Received"], ["preparing", "Preparing"], ["ready", "Ready"], ["completed", "Completed"], ["cancelled", "Cancelled"]];
function NotificationSettingsFormContent({ policy, version, pushEnabled }: { policy: NotificationPolicy; version: number; pushEnabled: boolean | null }) {
  const [draft, setDraft] = useState(policy), [expanded, setExpanded] = useState<OrderStatus | null>(null);
  const [state, action, pending] = useActionState(saveNotifications, { error: null, success: null, version });
  function change(status: OrderStatus, value: Partial<NotificationPolicy[OrderStatus]>) { setDraft(previous => ({ ...previous, [status]: { ...previous[status], ...value } })); }
  return <form action={action} className="admin-settings-card" onReset={event => event.preventDefault()} aria-busy={pending}>
    <h2 className="text-xl font-semibold">Notifications</h2>
    <input type="hidden" name="version" value={state.version ?? version} /><input type="hidden" name="notifications" value={JSON.stringify(draft)} />
    {pushEnabled !== true && <p className="my-3 text-sm text-muted">{pushEnabled === false ? "Browser push is off." : "Push status unavailable."} <Link href="#settings-api" className="underline underline-offset-4">API controls</Link></p>}
    <div className="mt-5 divide-y divide-line">{events.map(([status, label]) => <div key={status} className="py-4">
      <div className="notification-event-row"><h3 className="font-semibold">{label}</h3><CheckboxField id={`event-${status}-in-app`} label={status === "cancelled" ? "In-app · Always on" : "In-app"} checked={draft[status].in_app} disabled={pending || status === "cancelled"} onChange={event => change(status, { in_app: event.target.checked })} /><CheckboxField id={`event-${status}-push`} label="Browser push" checked={draft[status].push} disabled={pending} onChange={event => change(status, { push: event.target.checked })} /><Button variant="ghost" aria-expanded={expanded === status} aria-controls={`event-${status}-editor`} disabled={pending} onClick={() => setExpanded(expanded === status ? null : status)}>{expanded === status ? "Close message" : "Edit message"}</Button></div>
      {expanded === status && <div id={`event-${status}-editor`} className="mt-3 grid gap-4 lg:grid-cols-2"><div><TextAreaField id={`event-${status}-message`} label={`${label} message`} required maxLength={500} rows={3} disabled={pending} value={draft[status].message} onChange={event => change(status, { message: event.target.value })} /><p className="mt-1 text-xs text-muted">{draft[status].message.length}/500</p></div><div className="rounded-md bg-raised p-4"><p className="mb-2 text-xs text-muted">Preview · sample order</p><strong className="text-sm">Order #ABC123 · {label}</strong><p className="mt-2 whitespace-pre-wrap wrap-anywhere text-sm">{draft[status].message}</p></div></div>}
    </div>)}</div>
    <details className="my-4"><summary className="flex min-h-11 cursor-pointer items-center text-sm underline underline-offset-4">Delivery rules</summary><p className="py-3 text-sm text-muted">Customer preferences apply. Cancellation notices stay on. API controls override browser push. Existing pop-up and chime rules remain unchanged; status updates always stay visible.</p></details>
    <FormError>{state.error}</FormError><FormSuccess>{state.success}</FormSuccess>
    <Button type="submit" loading={pending} disabled={pending || events.some(([status]) => !draft[status].message.trim())}>Save notifications</Button>
  </form>;
}

export const NotificationSettingsForm = withPermission("settings.edit", NotificationSettingsFormContent, true);

"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AdminDialog } from "@/components/admin-dialog";
import { Button } from "@/components/ui/button";
import { InlineFormError as FormError } from "@/components/inline-form-error";
import { usePermissions } from "@/components/permission-controls";
import { catalog } from "@/lib/permissions";
import { readUserPermissions, saveUserPermissions, type AccountPermissions } from "@/app/actions/admin";

export function PermissionsEditor({ id, name, isMe }: { id: string; name: string; isMe: boolean }) {
  const { can } = usePermissions();
  const [open,setOpen] = useState(false), [pending,start] = useTransition();
  const [data,setData] = useState<AccountPermissions | null>(null);
  const [selected,setSelected] = useState<string[]>([]), [error,setError] = useState<string | null>(null);
  const [confirm,setConfirm] = useState(false), [removing,setRemoving] = useState<string | null>(null);
  const request = useRef(0), router = useRouter();
  function load() {
    const current = ++request.current;
    setError(null); setConfirm(false);
    start(async () => { const result = await readUserPermissions(id); if (current !== request.current) return;
      if (result.error) setError(result.error);
      else if (result.data) { setData(result.data); setSelected(result.data.permissions); }
    });
  }
  const choices = catalog.filter(p => p.role === data?.role);
  function change(key: string, enabled: boolean) {
    const next = new Set(selected);
    if (enabled) { next.add(key); for (const dependency of choices.find(p => p.key === key)?.requires || []) next.add(dependency); }
    else { next.delete(key); for (const choice of choices) if (choice.requires.includes(key)) next.delete(choice.key); }
    setSelected([...next]); setRemoving(null); setConfirm(false);
  }
  return <>
    <button type="button" className="admin-secondary-link" disabled={isMe} aria-label={"Permissions for " + name} title={isMe ? "You cannot change your own access." : undefined} onClick={event => { event.currentTarget.focus(); setOpen(true); setData(null); load(); }}>Permissions</button>
    {open && <AdminDialog wide title="Account permissions" description={name + (data ? " · " + data.role : "")} pending={pending} confirmation={confirm} onClose={() => { request.current++; setOpen(false); }}>
      <FormError>{error}</FormError>
      {pending && !data && <p role="status">Loading permissions…</p>}
      {error && <Button variant="ghost" onClick={load} disabled={pending}>Reload permissions</Button>}
      {data?.role === "customer" ? <p>Customer access is fixed by user type. Use suspension to disable an account.</p> : data && <>
        <fieldset disabled={pending || confirm || Boolean(removing)} className="min-w-0 space-y-5">
          {[...new Set(choices.map(p => p.group))].map(group => <fieldset key={group} className="border-t border-line pt-3"><legend className="pr-3 font-semibold">{group}</legend><div className="flex flex-wrap gap-x-5 gap-y-1">{choices.filter(p => p.group === group).map(choice => <label key={choice.key} className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-ink" checked={selected.includes(choice.key)} disabled={data.role === "admin" && !selected.includes(choice.key) && !can(choice.key)} onChange={event => {
            if (!event.target.checked && choices.some(p => p.requires.includes(choice.key) && selected.includes(p.key))) setRemoving(choice.key);
            else change(choice.key,event.target.checked);
          }} />{choice.label}</label>)}</div></fieldset>)}
        </fieldset>
        {removing && <div role="alert" className="mt-4 rounded-lg border border-line p-4"><p>Remove this view permission and its dependent actions?</p><div className="mt-3 flex gap-3"><Button onClick={() => change(removing,false)}>Remove access</Button><Button variant="ghost" onClick={() => setRemoving(null)}>Keep access</Button></div></div>}
        {confirm && <p role="status" className="mt-5">Apply these permissions? Access changes on the next request.</p>}
        <div className="mt-5 flex flex-wrap gap-3">
          <Button disabled={pending || Boolean(removing)} loading={pending} onClick={() => {
            if (!confirm) { setConfirm(true); return; }
            setError(null);
            start(async () => { const overrides = Object.fromEntries(choices.filter(p => !selected.includes(p.key)).map(p => [p.key,false])); const result = await saveUserPermissions(id,data.version,overrides);
              if (result.error) { setError(result.error); setConfirm(false); }
              else { setOpen(false); router.refresh(); }
            });
          }}>{confirm ? "Confirm permissions" : "Review changes"}</Button>
          {!confirm && <Button variant="ghost" disabled={pending} onClick={() => { setSelected(choices.map(p => p.key)); setConfirm(true); }}>Reset to role defaults</Button>}
          {confirm && <Button variant="ghost" disabled={pending} onClick={() => setConfirm(false)}>Back to editing</Button>}
        </div>
      </>}
      <Button variant="ghost" className="mt-4" disabled={pending} onClick={() => setOpen(false)}>Close</Button>
    </AdminDialog>}
  </>;
}

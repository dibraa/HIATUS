"use client";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AdminDialog } from "@/components/admin-dialog";
import { Button } from "@/components/ui/button";
import { InlineFormError as FormError } from "@/components/inline-form-error";
import { Permission } from "@/components/permission-controls";
import { formatPrice, formatDateTime } from "@/lib/format";
import { archiveMenuItem, readArchivedMenu, type ArchivedPage, type ArchivedItem } from "@/app/actions/menu";

export function ArchivedMenu() {
  const [open,setOpen] = useState(false), [pending,start] = useTransition();
  const [data,setData] = useState<ArchivedPage | null>(null), [error,setError] = useState<string | null>(null);
  const [draft,setDraft] = useState(""), [query,setQuery] = useState("");
  const [restoring,setRestoring] = useState<ArchivedItem | null>(null), [success,setSuccess] = useState<string | null>(null);
  const sequence = useRef(0), router = useRouter();
  function load(search = query, page = 1) {
    const request = ++sequence.current;
    setError(null);
    start(async () => { const result = await readArchivedMenu(search,page); if (request !== sequence.current) return;
      if (result.error) setError(result.error); else if (result.data) setData(result.data);
    });
  }
  return <>
    <Button variant="outline" onClick={event => { event.currentTarget.focus(); setOpen(true); setSuccess(null); load(); }}>Archived items</Button>
    {open && <AdminDialog wide closeLabel={restoring ? undefined : "Close archived menu items"} title={restoring ? "Restore menu item?" : "Archived menu items"} description={restoring ? restoring.name + " will return as unavailable. Enable it after checking stock and pricing." : undefined} confirmation={Boolean(restoring)} pending={pending} onClose={() => { sequence.current++; setOpen(false); setRestoring(null); }}>
      <FormError>{error}</FormError>{success && <p role="status" className="mb-3 text-success-soft-fg">{success}</p>}
      {restoring ? <div className="flex flex-wrap gap-3"><Button loading={pending} disabled={pending} onClick={() => {
        setError(null);start(async () => { const result = await archiveMenuItem(restoring._id,true); if (result.error) { setError(result.error); return; }
          setSuccess(restoring.name + " restored as unavailable.");setRestoring(null);load(query,1);router.refresh();
        });
      }}>Confirm restore</Button><Button variant="ghost" disabled={pending} onClick={() => { setRestoring(null); setError(null); }}>Back to archive</Button></div> : <>
        <form className="mb-4 flex flex-wrap items-end gap-3" onSubmit={event => { event.preventDefault();setQuery(draft);load(draft,1); }}><label className="min-w-0 flex-1 text-sm">Search archived items<input type="search" className="mt-2 block min-h-11 w-full rounded-lg border border-line bg-card px-3" value={draft} onChange={event => setDraft(event.target.value)} /></label><Button disabled={pending} type="submit">Search</Button></form>
        {pending && <p role="status">Loading archive…</p>}
        {error && <Button variant="ghost" disabled={pending} onClick={() => load(query,data?.page || 1)}>Retry archive</Button>}
        <div className="admin-table-scroll" role="region" aria-label="Archived items table" tabIndex={0}>
          <table className="w-full text-left text-sm"><caption className="sr-only">Archived menu items</caption><thead><tr>{["Item","Category","Price","Archived","Actions"].map(label => <th key={label} scope="col" className={["border-b border-line p-2 sm:p-3", ["Category", "Archived"].includes(label) ? "hidden sm:table-cell" : ""].join(" ")}>{label}</th>)}</tr></thead><tbody>
            {data?.items.map(item => <tr key={item._id}><th scope="row" className="max-w-64 break-words border-b border-line p-2 sm:p-3">{item.name}<span className="mt-1 block text-xs font-normal text-muted sm:hidden">{item.category}<br />{formatDateTime(item.archived_at)}</span></th><td className="hidden border-b border-line p-3 sm:table-cell">{item.category}</td><td className="numeric whitespace-nowrap border-b border-line p-2 sm:p-3">{formatPrice(item.price)}</td><td className="hidden border-b border-line p-3 sm:table-cell">{formatDateTime(item.archived_at)}</td><td className="border-b border-line p-2 sm:p-3"><Permission name="menu.archive"><Button variant="ghost" disabled={pending} aria-label={"Restore " + item.name} onClick={() => { setRestoring(item);setError(null); }}>Restore</Button></Permission></td></tr>)}
            {data?.items.length === 0 && <tr><td colSpan={5} className="p-5 text-muted">{query ? "No archived items match your search." : "No archived menu items."}</td></tr>}
          </tbody></table>
        </div>
        {data && <div className="mt-4 flex flex-wrap items-center gap-3"><p className="text-sm text-muted">{data.total} {data.total === 1 ? "item" : "items"} · Page {data.page} of {Math.max(1,Math.ceil(data.total/data.page_size))}</p><Button variant="ghost" disabled={pending || data.page <= 1} onClick={() => load(query,data.page-1)}>Previous</Button><Button variant="ghost" disabled={pending || data.page*data.page_size >= data.total} onClick={() => load(query,data.page+1)}>Next</Button></div>}
      </>}

    </AdminDialog>}
  </>;
}

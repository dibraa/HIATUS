import Link from "next/link";
export function AdminPagination({ path, query, page, pageSize, total }: {
  path: string; query: URLSearchParams; page: number; pageSize: number; total: number;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const href = (target: number) => { const next = new URLSearchParams(query); next.set("page", String(target)); return `${path}?${next}`; };
  return <nav className="mt-5 flex flex-wrap items-center justify-between gap-3" aria-label="Table pages">
    <p className="text-sm text-muted">{total} record{total === 1 ? "" : "s"} · Page {page} of {pages}</p>
    <div className="flex gap-2">
      {page > 1 && <Link href={href(page - 1)} className="admin-secondary-link">Previous</Link>}
      {page < pages && <Link href={href(page + 1)} className="admin-secondary-link">Next</Link>}
    </div>
  </nav>;
}

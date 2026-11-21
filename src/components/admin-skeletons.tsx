import type { ReactNode } from "react";
import { ControlSkeleton } from "@/components/ui/skeleton";

/**
 * Admin loading pieces, shared by the loading.tsx files under src/app/admin.
 *
 * Text is drawn as a glyph-sized bar inside an element that carries the REAL
 * type classes (`admin-stat-value`, `text-sm`, an <h1> inside
 * `.admin-page-header`…), so each line box is exactly the height admin.css
 * gives the real text at every breakpoint, and the admin overrides of shared
 * classes (`.ui-caps` labels at 13px, `.display` at 18px) are inherited
 * rather than re-guessed. Callers mark the region aria-hidden.
 */
export function TextBar({ width }: { width: string }) {
  return <span className={`skeleton inline-block h-[0.7em] max-w-full rounded-sm align-middle ${width}`} />;
}

/** The `Badge` box: same border, padding and caps line, so a badge cell is the real height. */
export function BadgeSkeleton({ width = "w-16" }: { width?: string }) {
  return <span className={`skeleton ui-caps inline-flex rounded-md border border-transparent px-2.5 py-1 text-2xs ${width}`}>&nbsp;</span>;
}

/**
 * A `TextField` / `SelectField` in admin: the label line (`ui-caps text-2xs`,
 * which admin.css renders at 13px / 1.5 — taller than the storefront label
 * `FieldSkeleton` is measured against), the 6px gap, then the 44px control.
 */
export function AdminFieldSkeleton({ label = "w-20", className = "" }: { label?: string; className?: string }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="ui-caps text-2xs"><TextBar width={label} /></div>
      <div className="skeleton h-control rounded-md" />
    </div>
  );
}

/** `AdminPageHeader`: the same <header> box, rule and spacing, with bars in the title and description lines. */
export function AdminPageHeaderSkeleton({ title = "w-48", description, action }: { title?: string; description?: string; action?: ReactNode }) {
  return (
    <header className="admin-page-header">
      <div className="min-w-0">
        <h1><TextBar width={title} /></h1>
        {description && <p><TextBar width={description} /></p>}
      </div>
      {action && <div className="admin-page-action">{action}</div>}
    </header>
  );
}

/** `AdminStatCard`, including its phone layout (admin.css restyles `.admin-stat` children below 480px). */
export function AdminStatSkeleton({ hint = true }: { hint?: boolean }) {
  return (
    <div className="admin-stat">
      <p className="admin-stat-label"><TextBar width="w-24" /></p>
      <p className="admin-stat-value"><TextBar width="w-20" /></p>
      {hint && <p className="admin-stat-hint"><TextBar width="w-32" /></p>}
    </div>
  );
}

/** A name over a muted second line, as in the account / customer cells. */
export function TwoLineCell({ first = "w-28", second = "w-20", gap = "mt-1" }: { first?: string; second?: string; gap?: string }) {
  return (
    <>
      <TextBar width={first} />
      <span className={`${gap} block text-xs`}><TextBar width={second} /></span>
    </>
  );
}

/**
 * A real <table> with the page's own table classes, so column widths, the
 * min-width and the horizontal scroll come from the same rules. Header cells
 * are `px-2 py-3` on a bottom rule; body cells default to `px-2 py-4`.
 */
export function AdminTableSkeleton({
  className,
  columns,
  rows,
  cell = "px-2 py-4",
}: {
  className: string;
  columns: { head: string; body?: ReactNode; align?: string }[];
  rows: number;
  cell?: string;
}) {
  return (
    <table className={className}>
      <thead className="border-b border-line text-xs">
        <tr>
          {columns.map((column, i) => (
            <th key={i} className={`px-2 py-3 ${column.align ?? ""}`}><TextBar width={column.head} /></th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-line">
        {Array.from({ length: rows }, (_, row) => (
          <tr key={row}>
            {columns.map((column, i) => (
              <td key={i} className={`${cell} ${column.align ?? ""}`}>{column.body ?? <TextBar width={column.head} />}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** `AdminPagination`: the record count beside one 44px page link. */
export function AdminPaginationSkeleton() {
  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm"><TextBar width="w-40" /></p>
      <div className="skeleton h-control w-[4.5rem] rounded-[.5rem]" />
    </div>
  );
}

/** `ActivityFilters` with its default 30-day range (no custom date row). */
export function ActivityFiltersSkeleton({ metrics = false }: { metrics?: boolean }) {
  return (
    <div className="admin-panel mb-5">
      <div className="admin-activity-main" data-metrics={metrics || undefined}>
        {!metrics && <AdminFieldSkeleton label="w-28" />}
        <AdminFieldSkeleton label="w-24" />
        <AdminFieldSkeleton label="w-14" />
      </div>
      {!metrics && (
        <div className="admin-activity-more">
          <div className="flex min-h-11 w-fit items-center pt-3 text-sm"><TextBar width="w-24" /></div>
        </div>
      )}
      <div className="admin-activity-footer">
        <p className="text-xs"><TextBar width="w-52" /></p>
        <ControlSkeleton className="w-32" />
      </div>
    </div>
  );
}

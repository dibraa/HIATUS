import { ControlSkeleton } from "@/components/ui/skeleton";
import { AdminFieldSkeleton, AdminPageHeaderSkeleton, AdminStatSkeleton, TextBar } from "@/components/admin-skeletons";

const TAB_WIDTHS = ["w-[4.5rem]", "w-28", "w-32", "w-44", "w-36"];

/** A chart's data table: eyebrow header row, then a few `py-2.5` rows. */
function DataTable({ columns, rows }: { columns: number; rows: number }) {
  return (
    <table className="mt-6 w-full text-left text-sm">
      <thead>
        <tr className="eyebrow border-b border-line">
          {Array.from({ length: columns }, (_, i) => <th key={i} className="py-2 pr-4"><TextBar width="w-14" /></th>)}
        </tr>
      </thead>
      <tbody>
        {Array.from({ length: rows }, (_, r) => (
          <tr key={r} className="border-b border-line last:border-0">
            {Array.from({ length: columns }, (_, i) => <td key={i} className="py-2.5 pr-4"><TextBar width={i === 0 ? "w-20" : "w-12"} /></td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** A report panel's `display` heading. */
function Heading() {
  return <p className="display mb-4 text-xl"><TextBar width="w-28" /></p>;
}

/**
 * Reports skeleton, in the default Sales view: header with the export
 * controls, the section tabs, the period filter, four stat cards, then the
 * Revenue, What sells, Best-selling flavours and peak-hours panels.
 * (loading.tsx cannot read the `view` query, so the other report views show
 * the Sales shape while they load.)
 */
export default function Loading() {
  return (
    <div aria-busy="true">
      <p className="sr-only" role="status">
        Loading reports…
      </p>

      <div aria-hidden="true" className="admin-reports">
        <AdminPageHeaderSkeleton
          title="w-32"
          action={
            <div className="flex flex-wrap gap-2">
              <ControlSkeleton className="w-24" />
              <ControlSkeleton className="w-40" />
            </div>
          }
        />

        <div className="report-tabs mb-5">
          {TAB_WIDTHS.map((width) => <div key={width} className={`skeleton h-11 rounded-[.5rem] ${width}`} />)}
        </div>

        <div className="admin-panel mb-6 flex flex-wrap items-end gap-4">
          <AdminFieldSkeleton label="w-14" className="w-36" />
          <AdminFieldSkeleton label="w-12" className="w-52" />
        </div>

        <div className="admin-stats">
          <AdminStatSkeleton />
          <AdminStatSkeleton />
          <AdminStatSkeleton />
          <AdminStatSkeleton hint={false} />
        </div>

        <div className="admin-panel admin-report-section">
          <Heading />
          <div className="skeleton h-72 rounded-[.5rem]" />
          <DataTable columns={6} rows={4} />
        </div>

        <div className="admin-panel admin-report-section">
          <Heading />
          <p className="mb-4 text-sm"><TextBar width="w-40" /></p>
          <div className="inline-flex min-h-11 items-center text-sm"><TextBar width="w-24" /></div>
        </div>

        <div className="admin-panel admin-report-section">
          <Heading />
          <div className="skeleton h-60 rounded-[.5rem]" />
          <DataTable columns={4} rows={4} />
        </div>

        <div className="admin-panel admin-report-section">
          {/* mb-4: admin.css gives every `.admin-report-section h2` a 1rem bottom margin. */}
          <p className="mb-4 text-xl font-semibold"><TextBar width="w-48" /></p>
          <p className="my-3 text-sm"><TextBar width="w-96" /></p>
          <p className="mb-5 text-sm"><TextBar width="w-44" /></p>
          <div className="skeleton h-44 rounded-[.5rem]" />
          <div className="flex min-h-11 items-center text-sm"><TextBar width="w-32" /></div>
        </div>
      </div>
    </div>
  );
}

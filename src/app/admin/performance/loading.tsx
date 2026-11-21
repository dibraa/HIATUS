import { ActivityFiltersSkeleton, AdminFieldSkeleton, AdminPageHeaderSkeleton, AdminStatSkeleton, AdminTableSkeleton, BadgeSkeleton, TextBar } from "@/components/admin-skeletons";

const COUNT_COLUMNS = [{ head: "w-12" }, { head: "w-10" }, { head: "w-10" }];

/** One of the count tables: staff member / action / period, then three counts. */
function CountTable({ first }: { first: string }) {
  return (
    <div className="admin-table-scroll">
      <AdminTableSkeleton
        className="w-full min-w-[28rem] text-left text-sm"
        rows={4}
        cell="px-2 py-3"
        columns={[{ head: first, body: <TextBar width="w-32" /> }, ...COUNT_COLUMNS.map((c) => ({ ...c, body: <TextBar width="w-6" /> }))]}
      />
    </div>
  );
}

/**
 * Staff activity skeleton: header with its description, the metrics filter
 * panel, four stat cards, the two count tables side by side, the grouped
 * summary and the recent-activity list — the page's `space-y-5` column.
 */
export default function Loading() {
  return (
    <div aria-busy="true">
      <p className="sr-only" role="status">
        Loading staff activity metrics…
      </p>

      <div aria-hidden="true" className="space-y-5">
        <AdminPageHeaderSkeleton title="w-64" description="w-64" />
        <ActivityFiltersSkeleton metrics />

        <div className="admin-stats">
          <AdminStatSkeleton />
          <AdminStatSkeleton hint={false} />
          <AdminStatSkeleton hint={false} />
          <AdminStatSkeleton hint={false} />
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          {["w-24", "w-12"].map((first) => (
            <div key={first} className="admin-panel">
              <p className="mb-4 text-lg font-semibold"><TextBar width="w-36" /></p>
              <CountTable first={first} />
            </div>
          ))}
        </div>

        <div className="admin-panel">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <p className="text-lg font-semibold"><TextBar width="w-40" /></p>
            <AdminFieldSkeleton label="w-24" className="w-32" />
          </div>
          <p className="mb-4 text-xs"><TextBar width="w-28" /></p>
          <CountTable first="w-28" />
        </div>

        <div className="admin-panel">
          <p className="mb-4 text-lg font-semibold"><TextBar width="w-44" /></p>
          <ul className="divide-y divide-line">
            {[0, 1, 2, 3].map((i) => (
              <li key={i} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm"><TextBar width="w-48" /></p>
                  <p className="mt-1 text-xs"><TextBar width="w-32" /></p>
                </div>
                <BadgeSkeleton width="w-[4.5rem]" />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

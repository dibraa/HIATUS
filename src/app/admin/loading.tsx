import { ControlSkeleton } from "@/components/ui/skeleton";
import { AdminPageHeaderSkeleton, AdminStatSkeleton, AdminTableSkeleton, BadgeSkeleton, TextBar } from "@/components/admin-skeletons";

/** A panel heading beside its 44px "See all" link, baseline-aligned like the page's. */
function PanelHeading({ className, width }: { className: string; width: string }) {
  return (
    <div className={`${className} flex items-baseline justify-between gap-4`}>
      <p className="text-lg font-semibold"><TextBar width={width} /></p>
      <div className="inline-flex min-h-11 items-center text-xs"><span><TextBar width="w-10" /></span></div>
    </div>
  );
}

/**
 * Dashboard skeleton: header, the three stat cards, sales trend beside the
 * trending list, the recent-orders table and the staff-activity strip — the
 * same `admin-dashboard` grid and panels as the loaded page.
 */
export default function Loading() {
  return (
    <div aria-busy="true">
      <p className="sr-only" role="status">
        Loading dashboard…
      </p>

      <div aria-hidden="true" className="admin-dashboard">
        <AdminPageHeaderSkeleton title="w-40" />

        <div className="admin-stats admin-stats-three">
          {[0, 1, 2].map((i) => <AdminStatSkeleton key={i} />)}
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.8fr)]">
          <div className="admin-panel">
            <PanelHeading className="mb-6" width="w-36" />
            <div className="skeleton h-56 rounded-[.5rem]" />
          </div>
          <div className="admin-panel">
            <PanelHeading className="mb-5" width="w-40" />
            <ol className="divide-y divide-line">
              {[0, 1, 2, 3, 4].map((i) => (
                <li key={i} className="flex items-center gap-3 py-3">
                  <div className="skeleton size-9 shrink-0 rounded-xl" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm"><TextBar width="w-32" /></p>
                    <p className="text-xs"><TextBar width="w-16" /></p>
                  </div>
                  <p className="text-sm"><TextBar width="w-6" /></p>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="admin-panel">
          <PanelHeading className="mb-4" width="w-32" />
          <div className="admin-table-scroll">
            <AdminTableSkeleton
              className="admin-recent-table w-full text-left text-sm"
              rows={8}
              columns={[
                { head: "w-3", body: <span className="text-xs"><TextBar width="w-4" /></span> },
                { head: "w-16", body: <TextBar width="w-28" /> },
                { head: "w-8", body: <span className="text-xs"><TextBar width="w-14" /></span> },
                { head: "w-8", body: <span className="text-xs"><TextBar width="w-14" /></span> },
                { head: "w-8", body: <TextBar width="w-14" /> },
                { head: "w-14", body: <span className="text-xs"><TextBar width="w-12" /></span> },
                { head: "w-10", body: <BadgeSkeleton width="w-20" /> },
              ]}
            />
          </div>
        </div>

        <div className="admin-panel">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-lg font-semibold"><TextBar width="w-32" /></p>
              <p className="mt-2 text-sm"><TextBar width="w-80" /></p>
            </div>
            <div className="flex flex-wrap gap-2">
              <ControlSkeleton className="w-28" />
              <ControlSkeleton className="w-28" />
            </div>
          </div>
          <p className="mt-3 text-xs"><TextBar width="w-96" /></p>
        </div>
      </div>
    </div>
  );
}

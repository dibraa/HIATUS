import { ActivityFiltersSkeleton, AdminPageHeaderSkeleton, AdminPaginationSkeleton, AdminTableSkeleton, BadgeSkeleton, TextBar, TwoLineCell } from "@/components/admin-skeletons";

/** Activity logs skeleton: header, the filter panel, then the log table and its pagination inside one panel. */
export default function Loading() {
  return (
    <div aria-busy="true">
      <p className="sr-only" role="status">
        Loading activity records…
      </p>

      <div aria-hidden="true">
        <AdminPageHeaderSkeleton title="w-44" />
        <ActivityFiltersSkeleton />
        <div className="admin-panel">
          <div className="admin-table-scroll">
            <AdminTableSkeleton
              className="relative w-full min-w-[48rem] text-left text-sm"
              rows={6}
              columns={[
                { head: "w-24", body: <TextBar width="w-36" /> },
                { head: "w-14", body: <TwoLineCell first="w-28" second="w-12" /> },
                { head: "w-12", body: <TextBar width="w-32" /> },
                { head: "w-12", body: <TwoLineCell first="w-16" second="w-36" /> },
                { head: "w-12", body: <BadgeSkeleton width="w-[4.5rem]" /> },
              ]}
            />
          </div>
          <AdminPaginationSkeleton />
        </div>
      </div>
    </div>
  );
}

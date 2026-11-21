import { AdminFieldSkeleton, AdminPageHeaderSkeleton, AdminPaginationSkeleton, AdminTableSkeleton, BadgeSkeleton, TextBar, TwoLineCell } from "@/components/admin-skeletons";

const XS = (width: string) => <span className="text-xs"><TextBar width={width} /></span>;

/**
 * Admin orders skeleton: header, the refresh note, the status select, then
 * the orders table (a page of seven rows) and its pagination below the panel.
 */
export default function Loading() {
  return (
    <div aria-busy="true">
      <p className="sr-only" role="status">
        Loading orders…
      </p>

      <div aria-hidden="true">
        <AdminPageHeaderSkeleton title="w-32" />
        <p className="mb-4 text-sm"><TextBar width="w-44" /></p>
        <div className="admin-orders-filter mb-6">
          <AdminFieldSkeleton label="w-40" />
        </div>

        <div className="admin-panel">
          <div className="admin-table-scroll">
            <AdminTableSkeleton
              className="admin-recent-table admin-orders-table w-full text-left text-sm"
              rows={7}
              columns={[
                { head: "w-3", body: XS("w-14") },
                { head: "w-16", body: <TwoLineCell first="w-24" second="w-20" gap="mt-0.5" /> },
                { head: "w-8", body: XS("w-14") },
                { head: "w-10", body: <><p className="text-xs"><TextBar width="w-32" /></p><p className="text-xs"><TextBar width="w-24" /></p></> },
                { head: "w-8", body: XS("w-12") },
                { head: "w-8", body: <TextBar width="w-14" /> },
                { head: "w-14", body: XS("w-10") },
                { head: "w-10", body: <BadgeSkeleton width="w-20" /> },
              ]}
            />
          </div>
        </div>

        <AdminPaginationSkeleton />
      </div>
    </div>
  );
}

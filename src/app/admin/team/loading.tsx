import { ControlSkeleton } from "@/components/ui/skeleton";
import { AdminFieldSkeleton, AdminPageHeaderSkeleton, AdminTableSkeleton, BadgeSkeleton, TextBar, TwoLineCell } from "@/components/admin-skeletons";

/**
 * Users skeleton: header, then the accounts panel with the search / role /
 * status toolbar and create button, the account count and the fixed-layout
 * `admin-team-table` (44px role select and action buttons set each row).
 */
export default function Loading() {
  return (
    <div aria-busy="true">
      <p className="sr-only" role="status">
        Loading users…
      </p>

      <div aria-hidden="true">
        <AdminPageHeaderSkeleton title="w-28" />

        <div className="admin-panel">
          <div className="admin-team-toolbar">
            <AdminFieldSkeleton label="w-24" />
            <AdminFieldSkeleton label="w-10" />
            <AdminFieldSkeleton label="w-14" />
            <div className="admin-team-toolbar-actions">
              <ControlSkeleton className="w-40" />
            </div>
          </div>

          <p className="admin-team-count"><TextBar width="w-20" /></p>
          <div className="admin-table-scroll">
            <AdminTableSkeleton
              className="admin-team-table w-full text-left text-sm"
              rows={6}
              columns={[
                { head: "w-8", body: <TwoLineCell first="w-32" second="w-44" /> },
                { head: "w-24", body: <TextBar width="w-28" /> },
                { head: "w-8", body: <ControlSkeleton className="w-full" /> },
                { head: "w-12", body: <BadgeSkeleton width="w-[4.5rem]" /> },
                {
                  head: "w-14",
                  align: "text-right",
                  body: (
                    <div className="admin-team-inline-actions">
                      <ControlSkeleton className="w-16" />
                      <ControlSkeleton className="w-24" />
                      <ControlSkeleton className="w-32" />
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

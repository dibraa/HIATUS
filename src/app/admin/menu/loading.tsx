import { ControlSkeleton } from "@/components/ui/skeleton";
import { AdminFieldSkeleton, AdminPageHeaderSkeleton, AdminPaginationSkeleton, TextBar } from "@/components/admin-skeletons";

/**
 * Admin menu skeleton: header with its three actions, the filter panel, then
 * menu rows on the page's own `admin-menu-row` grid (photo, name block,
 * availability, price, actions), which re-flows the same way on phones.
 */
export default function Loading() {
  return (
    <div aria-busy="true">
      <p className="sr-only" role="status">
        Loading menu…
      </p>

      <div aria-hidden="true" className="admin-menu-page">
        <AdminPageHeaderSkeleton
          title="w-44"
          action={
            <div className="flex flex-wrap gap-2">
              <ControlSkeleton className="w-44" />
              <ControlSkeleton className="w-28" />
              <ControlSkeleton className="w-52" />
            </div>
          }
        />

        <div className="admin-panel mb-5 grid items-end gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <AdminFieldSkeleton label="w-24" />
          <AdminFieldSkeleton label="w-16" />
          <AdminFieldSkeleton label="w-20" />
        </div>

        <ul className="admin-menu-list">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <li key={i} className="admin-menu-row">
              <div className="w-14 shrink-0">
                <div className="skeleton aspect-square w-full rounded-md" />
              </div>
              <div className="min-w-0 flex-1">
                <p><TextBar width="w-36" /></p>
                <p className="admin-menu-flavor"><TextBar width="w-20" /></p>
                <p className="mt-1 text-xs"><TextBar width="w-16" /></p>
              </div>
              <p className="admin-menu-availability"><span className="skeleton w-[4.5rem]">&nbsp;</span></p>
              <p className="admin-menu-price"><TextBar width="w-14" /><small><TextBar width="w-10" /></small></p>
              <div className="admin-menu-actions">
                <ControlSkeleton className="w-40" />
                <ControlSkeleton className="w-16" />
                <ControlSkeleton className="w-16" />
              </div>
            </li>
          ))}
        </ul>

        <AdminPaginationSkeleton />
      </div>
    </div>
  );
}

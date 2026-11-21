import { ControlSkeleton } from "@/components/ui/skeleton";
import { AdminFieldSkeleton, AdminPageHeaderSkeleton, BadgeSkeleton, TextBar } from "@/components/admin-skeletons";

const NAV_WIDTHS = ["w-16", "w-[4.5rem]", "w-24", "w-24", "w-24", "w-24"];

/** `SettingsCard`'s heading and description lines. */
function CardHeading({ title, description }: { title: string; description: string }) {
  return (
    <>
      <p className="display text-xl"><TextBar width={title} /></p>
      <p className="mt-1.5 text-sm"><TextBar width={description} /></p>
    </>
  );
}

/**
 * Settings skeleton: header, the storefront-status row, then the section nav
 * beside the first cards — Ordering, Payment method and the seven opening-hours
 * rows — on the page's `admin-settings-layout` grid.
 */
export default function Loading() {
  return (
    <div aria-busy="true">
      <p className="sr-only" role="status">
        Loading settings…
      </p>

      <div aria-hidden="true" className="mx-auto max-w-6xl">
        <AdminPageHeaderSkeleton title="w-36" />

        <div className="admin-settings-status">
          <TextBar width="w-28" />
          <BadgeSkeleton width="w-20" />
          <BadgeSkeleton width="w-28" />
        </div>

        <div className="admin-settings-layout">
          {/* The links' own box: 44px rows, chips with a border below 768px. */}
          <div className="admin-settings-nav">
            {NAV_WIDTHS.map((width, i) => (
              <div key={i} className="flex min-h-11 items-center rounded-[.5rem] px-3 py-2.5 text-sm max-md:border max-md:border-line-strong max-md:py-2">
                <TextBar width={width} />
              </div>
            ))}
          </div>

          <div className="admin-settings-sections">
            <div className="admin-settings-card">
              <CardHeading title="w-24" description="w-72" />
              <div className="mt-5 flex flex-col gap-4">
                <div className="flex min-h-11 items-center gap-2.5 text-sm">
                  <div className="skeleton size-4 shrink-0 rounded-sm" />
                  <TextBar width="w-32" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <AdminFieldSkeleton label="w-48" />
                  <p className="text-xs"><TextBar width="w-72" /></p>
                </div>
              </div>
              <ControlSkeleton className="mt-5 w-24" />
            </div>

            <div className="admin-panel">
              <p className="text-lg font-semibold"><TextBar width="w-36" /></p>
              <p className="mt-3 text-sm"><TextBar width="w-10" /></p>
              <p className="mt-1 text-sm"><TextBar width="w-56" /></p>
            </div>

            <div className="admin-settings-card">
              <CardHeading title="w-32" description="w-80" />
              <div className="mt-5 flex flex-col gap-4">
                <div className="flex flex-col gap-3">
                  {/* Real tags, because admin.css re-places the row's span / label children on phones. */}
                  {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="admin-hours-row">
                      <span className="text-sm"><TextBar width="w-20" /></span>
                      <label><div className="skeleton h-11 w-full rounded-md" /></label>
                      <span aria-hidden="true" className="text-sm"><TextBar width="w-2" /></span>
                      <label><div className="skeleton h-11 w-full rounded-md" /></label>
                      <label className="ml-auto flex min-h-11 items-center gap-2 text-sm">
                        <div className="skeleton size-4 shrink-0 rounded-sm" />
                        <TextBar width="w-12" />
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <ControlSkeleton className="mt-5 w-32" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

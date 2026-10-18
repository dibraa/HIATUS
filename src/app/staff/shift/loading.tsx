import { ControlSkeleton, FieldSkeleton } from "@/components/ui/skeleton";
import { StaffPageHeading } from "../staff-page-heading";

/**
 * My shift while it loads: the heading, the intro line, then the shift form
 * beside the recent-shifts list (stacked on narrow screens), as on the page.
 */
export default function Loading() {
  return (
    <div aria-busy="true">
      <StaffPageHeading title="My shift" />
      <p role="status" className="sr-only">
        Loading your shift
      </p>
      <div aria-hidden="true" className="grid gap-5 pt-4">
        <div className="skeleton my-[3px] h-4 w-full max-w-sm rounded-sm" />
        <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-8">
          <div className="staff-panel grid gap-4 p-5">
            <div className="grid gap-2">
              <div className="skeleton h-6 w-40 rounded-sm" />
              <div className="skeleton h-4 w-full rounded-sm" />
              <div className="skeleton h-4 w-2/3 rounded-sm" />
            </div>
            <FieldSkeleton />
            <ControlSkeleton className="mt-1 w-full" />
          </div>
          <div>
            <div className="skeleton mb-3 h-[18px] w-32 rounded-sm" />
            <div className="flex flex-col gap-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="staff-panel grid gap-3 p-4"
                >
                  <div className="flex justify-between gap-2">
                    <div className="skeleton h-4 w-36 rounded-sm" />
                    <div className="skeleton h-3 w-28 rounded-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-3 border-t border-line pt-3 sm:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, j) => (
                      <div key={j} className="grid gap-1.5">
                        <div className="skeleton h-3 w-16 rounded-sm" />
                        <div className="skeleton h-4 w-20 rounded-sm" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

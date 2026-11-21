import { StaffPageHeading } from "../staff-page-heading";

/**
 * My shift while it loads: the heading, then the clock-in form beside the
 * recent-shifts list (stacked on narrow screens), as on the page.
 */
export default function Loading() {
  return (
    <div aria-busy="true">
      <StaffPageHeading title="My shift" />
      <p role="status" className="sr-only">
        Loading your shift
      </p>
      <div aria-hidden="true" className="grid gap-5 pt-4">
        <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-8">
          {/* ClockInForm: title, the 22px label over a 44px input, then the
              48px (size lg) Clock in button. */}
          <div className="staff-panel p-5">
            <div className="skeleton h-4 w-36 rounded-sm" />
            <div className="mt-4 flex flex-col gap-1.5">
              <div className="skeleton my-[3px] h-4 w-40 rounded-sm" />
              <div className="skeleton h-11 rounded-md" />
            </div>
            <div className="skeleton mt-5 h-12 w-full rounded-md" />
          </div>
          <div>
            <div className="skeleton mb-3 h-4 w-32 rounded-sm" />
            <div className="flex flex-col gap-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="staff-panel p-4">
                  {/* A 24px date line beside the 19.5px "Ended" caption. */}
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div className="skeleton my-1 h-4 w-36 rounded-sm" />
                    <div className="skeleton h-3 w-28 rounded-sm" />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 border-t border-line pt-3 sm:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, j) => (
                      <div key={j} className="grid gap-0.5">
                        <div className="skeleton my-1 h-3 w-16 rounded-sm" />
                        <div className="skeleton my-[3px] h-4 w-20 rounded-sm" />
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

import { StaffPageHeading } from "../staff-page-heading";

/**
 * Availability while it loads: the heading, the sold-out count and a category of
 * item rows at the real row size (56px photo, two text lines, the switch),
 * so the list lands without a jump.
 */
export default function Loading() {
  return (
    <div aria-busy="true">
      <StaffPageHeading title="Availability" />
      <p role="status" className="sr-only">
        Loading availability
      </p>
      <div aria-hidden="true" className="grid gap-5 pt-4">
        {/* The one 22px sold-out count line above the list. */}
        <div className="grid gap-1">
          <div className="skeleton my-[3px] h-4 w-52 rounded-sm" />
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between">
            <div className="skeleton my-[2.5px] h-4 w-16 rounded-sm" />
            <div className="skeleton h-3 w-10 rounded-sm" />
          </div>
          <div className="grid gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="staff-panel flex items-center gap-3 p-3"
              >
                <div className="skeleton size-14 shrink-0 rounded-md" />
                <div className="grid min-w-0 flex-1 gap-1.5">
                  <div className="skeleton h-4 w-32 rounded-sm" />
                  <div className="skeleton h-3 w-24 rounded-sm" />
                </div>
                <div className="skeleton h-6 w-11 shrink-0 rounded-full" />
                <div className="skeleton h-3 w-[4.5rem] shrink-0 rounded-sm" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

import { ControlSkeleton } from "@/components/ui/skeleton";
import { StaffPageHeading } from "./staff-page-heading";

const LANES = ["New", "Making", "Ready"];

/**
 * The Counter while it loads: the same heading, view bar and three lanes of
 * fixed-height tickets, built from the board's own classes so nothing moves
 * when the real orders arrive.
 */
export default function Loading() {
  return (
    <div className="counter-page" aria-busy="true">
      <StaffPageHeading title="Counter" />
      <p role="status" className="sr-only">
        Loading the counter
      </p>
      <div aria-hidden="true">
        <div className="counter-view-bar">
          <div className="counter-view-tabs">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex min-h-11 items-center">
                <div className="skeleton h-4 w-14 rounded-sm" />
              </div>
            ))}
          </div>
        </div>
        <div className="counter-payment-filters">
          <div className="skeleton h-9 w-[6.5rem] rounded-[10px]" />
          <div className="skeleton h-9 w-24 rounded-[10px]" />
        </div>
        <div className="counter-lanes">
          {LANES.map((lane) => (
            <section key={lane} className="counter-lane">
              <div className="counter-lane-heading">
                <div className="grid">
                  <div className="skeleton h-[22px] w-20 rounded-sm" />
                  {/* A <p>, so staff.css spaces it like the real lane
                      description and hides it below 1181px the same way. */}
                  <p className="skeleton h-5 w-28 rounded-sm" />
                </div>
                <div className="skeleton size-9 rounded-full" />
              </div>
              <div className="counter-lane-tickets">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="counter-ticket ticket-edges">
                    <div className="grid gap-2">
                      <div className="skeleton h-6 w-24 rounded-sm" />
                      <div className="skeleton h-3 w-36 rounded-sm" />
                    </div>
                    <div />
                    <div className="grid content-start gap-2">
                      <div className="skeleton h-4 w-3/4 rounded-sm" />
                      <div className="skeleton h-4 w-1/2 rounded-sm" />
                    </div>
                    <div className="grid gap-3">
                      <div className="skeleton h-4 w-full rounded-sm" />
                      <ControlSkeleton className="w-full" />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

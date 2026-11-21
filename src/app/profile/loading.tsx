import { ControlSkeleton, FieldSkeleton } from "@/components/ui/skeleton";

/**
 * Account skeleton — AccountWorkspace's identity header, the section tabs
 * (a row, a column from lg), and the Details panel's profile form.
 */
export default function Loading() {
  return (
    <div aria-busy="true">
      <p className="sr-only" role="status">
        Loading your account…
      </p>

      <div aria-hidden="true" className="mx-auto max-w-6xl py-2">
        <div className="mb-8 border-b border-line pb-6">
          <div className="skeleton display mb-6 h-lh w-[6em] max-w-full rounded-md text-4xl" />
          <div className="flex min-w-0 items-center gap-4">
            <div className="skeleton h-14 w-14 shrink-0 rounded-xl" />
            <div className="min-w-0">
              <div className="skeleton h-lh w-40 rounded text-lg" />
              <div className="skeleton mt-1 h-lh w-52 max-w-full rounded text-sm" />
            </div>
          </div>
        </div>

        <div className="grid items-start gap-5 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-8">
          <div className="flex min-w-0 gap-2 overflow-hidden pb-1 lg:flex-col lg:pb-0">
            {/* Tab: one text-sm line, py-3 and a 1px border */}
            {["w-[5.5rem]", "w-[8.5rem]", "w-24"].map((width) => (
              <div key={width} className={`skeleton h-[calc(1lh+1.625rem)] shrink-0 rounded-lg text-sm lg:w-auto ${width}`} />
            ))}
          </div>

          <div className="min-w-0 rounded-2xl border border-line bg-card p-5 sm:p-8">
            <div className="skeleton display mb-6 h-lh w-[6em] max-w-full rounded text-2xl" />
            <div className="flex max-w-xl flex-col gap-4">
              <FieldSkeleton />
              <FieldSkeleton />
              <FieldSkeleton />
              <ControlSkeleton className="mt-1 w-40 self-start" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

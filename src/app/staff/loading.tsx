import { ControlSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div role="status" aria-label="Loading the queue">
      <p className="sr-only">Loading the queue</p>
      <div className="display text-4xl text-ink" aria-hidden="true">
        Order Queue
      </div>
      <div aria-hidden="true" className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="grid gap-1.5 rounded-2xl bg-card px-4 py-3 ring-1 ring-line">
            <div className="skeleton h-3 w-12 rounded-sm" />
            <div className="skeleton h-7 w-16 rounded-sm" />
          </div>
        ))}
      </div>
      <div aria-hidden="true" className="mt-3 grid grid-cols-1 gap-3.5 sm:grid-cols-2 2xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="grid gap-2 rounded-2xl bg-card p-4 ring-1 ring-line">
            <div className="skeleton h-6 w-24 rounded-sm" />
            <div className="skeleton h-4 w-3/4 rounded-sm" />
            <div className="skeleton h-4 w-1/2 rounded-sm" />
            <ControlSkeleton className="mt-1 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

import { ControlSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div role="status" aria-label="Loading the queue">
      <p className="sr-only">Loading the queue</p>
      <div aria-hidden="true" className="mb-3 flex gap-7 border-b border-line pb-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="grid gap-1.5">
            <div className="skeleton h-3 w-10 rounded-sm" />
            <div className="skeleton h-6 w-14 rounded-sm" />
          </div>
        ))}
      </div>
      <ul aria-hidden="true" className="divide-y divide-line overflow-hidden rounded-2xl bg-card ring-1 ring-line">
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i} className="flex min-h-[4.25rem] items-center gap-3 px-4 py-3">
            <div className="grid flex-1 gap-1.5">
              <div className="skeleton h-4 w-24 rounded-sm" />
              <div className="skeleton h-4 w-3/4 rounded-sm" />
            </div>
            <div className="skeleton h-4 w-10 rounded-sm" />
            <ControlSkeleton className="w-36" />
          </li>
        ))}
      </ul>
    </div>
  );
}

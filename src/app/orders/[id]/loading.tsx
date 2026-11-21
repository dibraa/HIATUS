/**
 * Order detail skeleton — back link, title and badge, the status panel (in
 * its pending shape: progress, message, wait estimate), the receipt, and the
 * cancel row. Pending is the state checkout lands on.
 */
export default function Loading() {
  return (
    <div aria-busy="true">
      <p className="sr-only" role="status">
        Loading order…
      </p>

      <div aria-hidden="true" className="mx-auto max-w-2xl py-2">
        <div className="skeleton h-lh w-24 rounded text-sm" />

        <div className="mt-4 flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
          <div>
            <div className="skeleton display h-lh w-[6em] rounded-md text-3xl" />
            <div className="skeleton mt-1.5 h-lh w-44 rounded text-sm" />
          </div>
          <div className="skeleton h-[calc(1lh+10px)] w-24 rounded-md text-2xs" />
        </div>

        <div className="mt-6 rounded-lg border border-line bg-card p-5">
          <div className="mb-5 flex gap-1.5">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="skeleton h-1.5 w-full rounded-full" />
                <div className="flex flex-col">
                  <div className="skeleton h-lh w-14 max-w-full rounded text-xs" />
                  {i === 0 && <div className="skeleton mt-0.5 h-lh w-24 max-w-full rounded text-2xs" />}
                </div>
              </div>
            ))}
          </div>
          <div className="skeleton h-lh w-3/4 rounded text-base" />
          {/* WaitEstimate reserves an h-5 line */}
          <div className="skeleton mt-2 h-5 w-56 max-w-full rounded" />
        </div>

        <div className="mt-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="skeleton display h-lh w-[4em] rounded text-xl" />
            <div className="flex flex-wrap items-center gap-2">
              <div className="skeleton h-[calc(1lh+10px)] w-20 rounded-md text-2xs" />
              <div className="skeleton h-[calc(1lh+10px)] w-28 rounded-md text-2xs" />
            </div>
          </div>

          <div className="rounded-lg border border-line bg-card">
            <div className="divide-y divide-line">
              {[0, 1].map((i) => (
                <div key={i} className="flex items-baseline justify-between gap-4 px-4 py-3 text-sm">
                  <div className="skeleton h-lh w-48 max-w-full rounded" />
                  <div className="skeleton h-lh w-16 shrink-0 rounded" />
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-1.5 border-t border-line px-4 py-3.5 text-sm">
              <div className="flex justify-between gap-4">
                <div className="skeleton h-lh w-16 rounded" />
                <div className="skeleton h-lh w-16 rounded" />
              </div>
              <div className="mt-1 flex items-baseline justify-between gap-4 border-t border-line pt-3">
                <div className="skeleton display h-lh w-[3em] rounded text-lg" />
                <div className="skeleton h-lh w-20 rounded text-base" />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="skeleton h-9 w-32 rounded-md" />
          <div className="skeleton h-lh w-48 rounded text-xs" />
        </div>
      </div>
    </div>
  );
}

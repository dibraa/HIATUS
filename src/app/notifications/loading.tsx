/** Notifications skeleton — back button, page header, then the feed card. */
export default function Loading() {
  return (
    <div aria-busy="true">
      <p className="sr-only" role="status">
        Loading notifications…
      </p>

      <div aria-hidden="true" className="mx-auto max-w-2xl py-2">
        <div className="mb-6">
          <div className="skeleton h-9 w-44 rounded-md" />
        </div>

        <div className="mb-heading">
          <div className="skeleton display h-lh w-[6.5em] max-w-full rounded-md text-6xl" />
        </div>

        <div className="rounded-xl border border-line bg-card">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <div className="skeleton h-lh w-28 rounded text-sm" />
            <div className="skeleton h-lh w-24 rounded text-xs" />
          </div>
          {[0, 1, 2].map((i) => (
            <div key={i} className="border-b border-line px-5 py-4 last:border-0">
              <div className="flex items-start gap-3">
                <div className="skeleton mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1">
                  <div className="skeleton h-lh w-40 max-w-full rounded text-sm" />
                  <div className="skeleton mt-0.5 h-lh w-72 max-w-full rounded text-sm" />
                  <div className="skeleton mt-1 h-lh w-36 rounded text-xs" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

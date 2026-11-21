/** Customer orders skeleton — page header, then one group of order rows. */
export default function Loading() {
  return (
    <div aria-busy="true">
      <p className="sr-only" role="status">
        Loading your orders…
      </p>

      <div aria-hidden="true" className="mx-auto max-w-2xl py-2">
        <div className="mb-heading">
          <div className="skeleton display h-lh w-[4.6em] max-w-full rounded-md text-6xl" />
        </div>

        <div className="skeleton eyebrow mb-3 h-lh w-24 rounded" />
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-4 rounded-lg border border-line bg-card px-4 py-3.5"
            >
              <div className="min-w-0 text-sm">
                <div className="skeleton h-lh w-20 rounded" />
                <div className="skeleton h-lh w-44 max-w-full rounded" />
                <div className="skeleton mt-0.5 h-lh w-16 rounded" />
              </div>
              {/* OrderStatusBadge: a 2xs line, py-1 and a 1px border */}
              <div className="skeleton h-[calc(1lh+10px)] w-24 shrink-0 rounded-md text-2xs" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Admin orders skeleton — header, filter tabs, then a list of order cards. */
export default function Loading() {
  return (
    <div aria-busy="true">
      <p className="sr-only" role="status">
        Loading orders…
      </p>

      <div aria-hidden="true">
        {/* Page header */}
        <div className="mb-6 space-y-2">
          <div className="skeleton h-9 w-32 rounded-md" />
          <div className="skeleton h-4 w-72 max-w-full rounded" />
        </div>

        {/* Filter tabs */}
        <div className="mb-6 flex gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-9 w-24 rounded-md" />
          ))}
        </div>

        {/* Order cards */}
        <div className="flex flex-col gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-28 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

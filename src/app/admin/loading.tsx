/** Admin dashboard skeleton — mirrors the stat cards, chart, and recent orders layout. */
export default function Loading() {
  return (
    <div aria-busy="true">
      <p className="sr-only" role="status">
        Loading dashboard…
      </p>

      <div aria-hidden="true" className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="skeleton h-7 w-48 rounded-md" />
            <div className="skeleton h-4 w-32 rounded" />
          </div>
          <div className="skeleton h-10 w-28 rounded-full" />
        </div>

        {/* Stat cards */}
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-24 rounded-xl" />
          ))}
        </div>

        {/* Chart + trending */}
        <div className="grid gap-5 xl:grid-cols-2">
          <div className="skeleton h-80 rounded-2xl" />
          <div className="skeleton h-80 rounded-2xl" />
        </div>

        {/* Recent orders */}
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    </div>
  );
}

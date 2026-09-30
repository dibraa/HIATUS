/** Admin menu skeleton — header, then a list of menu item rows. */
export default function Loading() {
  return (
    <div aria-busy="true">
      <p className="sr-only" role="status">
        Loading menu…
      </p>

      <div aria-hidden="true">
        {/* Page header */}
        <div className="mb-6 flex items-end justify-between">
          <div className="space-y-2">
            <div className="skeleton h-9 w-36 rounded-md" />
            <div className="skeleton h-4 w-80 max-w-full rounded" />
          </div>
          <div className="skeleton h-10 w-24 rounded-md" />
        </div>

        {/* Menu item rows */}
        <div className="flex flex-col gap-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-16 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Customer orders skeleton — header, then a list of order rows. */
export default function Loading() {
  return (
    <div aria-busy="true" className="mx-auto max-w-2xl py-2">
      <p className="sr-only" role="status">
        Loading orders…
      </p>

      <div aria-hidden="true">
        {/* Page header */}
        <div className="mb-6 space-y-2">
          <div className="skeleton h-9 w-36 rounded-md" />
          <div className="skeleton h-4 w-64 max-w-full rounded" />
        </div>

        {/* Order rows */}
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-16 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Profile skeleton — header, then a two-column form layout. */
export default function Loading() {
  return (
    <div aria-busy="true" className="mx-auto max-w-6xl py-2">
      <p className="sr-only" role="status">
        Loading profile…
      </p>

      <div aria-hidden="true">
        {/* Page header */}
        <div className="mb-6">
          <div className="skeleton h-9 w-36 rounded-md" />
        </div>

        {/* Two-column forms */}
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="skeleton h-7 w-28 rounded-md" />
            <div className="skeleton h-[70px] rounded-md" />
            <div className="skeleton h-[70px] rounded-md" />
            <div className="skeleton h-11 rounded-md" />
          </div>
          <div className="space-y-4">
            <div className="skeleton h-7 w-32 rounded-md" />
            <div className="skeleton h-32 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}

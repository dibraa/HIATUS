/** Forgot password skeleton — header, then the form layout. */
export default function Loading() {
  return (
    <div aria-busy="true" className="mx-auto max-w-sm py-8">
      <p className="sr-only" role="status">
        Loading…
      </p>

      <div aria-hidden="true">
        {/* Page header */}
        <div className="mb-6 space-y-2">
          <div className="skeleton h-9 w-44 rounded-md" />
          <div className="skeleton h-4 w-72 max-w-full rounded" />
        </div>

        {/* Form fields */}
        <div className="flex flex-col gap-4">
          <div className="skeleton h-[70px] rounded-md" />
          <div className="skeleton h-11 rounded-md" />
        </div>
      </div>
    </div>
  );
}

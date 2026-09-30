/** Checkout skeleton — header, then the form layout. */
export default function Loading() {
  return (
    <div aria-busy="true" className="mx-auto max-w-lg py-2">
      <p className="sr-only" role="status">
        Loading checkout…
      </p>

      <div aria-hidden="true">
        {/* Page header */}
        <div className="mb-6 space-y-2">
          <div className="skeleton h-9 w-32 rounded-md" />
          <div className="skeleton h-4 w-56 max-w-full rounded" />
        </div>

        {/* Form fields */}
        <div className="flex flex-col gap-4">
          <div className="skeleton h-[70px] rounded-md" />
          <div className="skeleton h-[70px] rounded-md" />
          <div className="skeleton h-[70px] rounded-md" />
          <div className="skeleton h-12 rounded-md" />
        </div>
      </div>
    </div>
  );
}

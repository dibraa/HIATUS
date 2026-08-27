/** Product page skeleton — same two-column shape as the loaded page. */
export default function Loading() {
  return (
    <div aria-busy="true">
      <p className="sr-only" role="status">
        Loading drink…
      </p>

      <div aria-hidden="true" className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="skeleton aspect-square w-full rounded-xl" />

        <div className="flex flex-col gap-4">
          <div className="skeleton h-3 w-20 rounded" />
          <div className="skeleton h-10 w-3/4 rounded-md" />
          <div className="skeleton h-4 w-32 rounded" />
          <div className="skeleton h-16 w-full rounded-md" />
          <div className="skeleton mt-3 h-64 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

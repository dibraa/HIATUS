import { ControlSkeleton, MenuCardSkeleton } from "@/components/ui/skeleton";

/**
 * Product page skeleton, in the loaded page's order and spacing: the Back
 * button, the matted photo beside the details and the order card, then the
 * reviews and the four related items.
 */
export default function Loading() {
  return (
    <div aria-busy="true">
      <p className="sr-only" role="status">
        Loading drink…
      </p>

      <div aria-hidden="true" className="flex flex-col gap-12">
        <ControlSkeleton className="-mb-4 w-24" />

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="matte lg:self-start">
            <div className="skeleton aspect-square w-full rounded-xl" />
          </div>

          <div className="flex flex-col">
            <div className="skeleton h-3 w-20 rounded-sm" />
            <div className="skeleton mt-2 h-10 w-3/4 rounded-md" />
            <div className="skeleton mt-3 h-4 w-40 rounded-sm" />
            <div className="skeleton mt-5 h-4 w-full max-w-[60ch] rounded-sm" />
            <div className="skeleton mt-2 h-4 w-2/3 rounded-sm" />
            {/* The order card: price, sizes, quantity and button, notes. */}
            <div className="mt-7 rounded-lg border border-line bg-card p-5">
              <div className="skeleton h-9 w-32 rounded-md" />
              <div className="skeleton mt-5 h-3 w-12 rounded-sm" />
              <div className="mt-2 flex gap-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="skeleton h-14 flex-1 rounded-md" />
                ))}
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <ControlSkeleton className="min-w-[12rem] flex-1" />
                <ControlSkeleton className="min-w-[12rem] flex-1" />
              </div>
              <div className="mt-5 flex flex-col gap-1.5 border-t border-line pt-4">
                <div className="skeleton h-3 w-3/4 rounded-sm" />
                <div className="skeleton h-3 w-1/2 rounded-sm" />
              </div>
            </div>
          </div>
        </div>

        <section>
          <div className="skeleton h-7 w-28 rounded-md" />
          <div className="skeleton mt-4 h-28 rounded-lg" />
        </section>

        <section>
          <div className="skeleton h-7 w-40 rounded-md" />
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <MenuCardSkeleton key={i} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

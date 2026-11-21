import { MenuCardSkeleton } from "@/components/ui/skeleton";

/**
 * The signed-in home while its data loads, in CustomerHome's order and
 * spacing: the two-line greeting with the open status, the order card, then
 * the Browse category tiles and the four-up Popular grid. "Your usual" only
 * shows for customers with saved orders, so it gets no placeholder.
 */
export function CustomerHomeSkeleton() {
  return (
    <div aria-busy="true">
      <p className="sr-only" role="status">
        Loading your home…
      </p>
      <div aria-hidden="true" className="flex flex-col gap-section">
        <section>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex flex-col gap-2">
              <div className="skeleton h-[clamp(2.3rem,7vw,3.8rem)] w-[min(80vw,26rem)] rounded-lg" />
              <div className="skeleton h-[clamp(2.3rem,7vw,3.8rem)] w-[min(50vw,14rem)] rounded-lg" />
            </div>
            <div className="skeleton h-4 w-40 rounded-sm" />
          </div>
          <div className="skeleton mt-6 h-14 rounded-2xl sm:h-[4.25rem]" />
        </section>

        <section>
          <SectionHeading />
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="skeleton min-h-28 rounded-2xl sm:min-h-32" />
            ))}
          </div>
        </section>

        <section>
          <SectionHeading />
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <MenuCardSkeleton key={i} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function SectionHeading() {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div className="skeleton h-9 w-44 rounded-md sm:h-12" />
      <div className="skeleton h-4 w-20 rounded-sm" />
    </div>
  );
}

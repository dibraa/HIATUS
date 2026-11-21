import { MenuCardSkeleton } from "@/components/ui/skeleton";

/**
 * The menu while it loads, in the page's own three columns: the Back button
 * above, then the title and category sidebar (from xl), the search field,
 * category chips (below xl) and the product grid with its container-query
 * columns, and the ticket rail (from xl).
 */
export default function Loading() {
  return (
    <div aria-busy="true">
      <p className="sr-only" role="status">
        Loading the menu…
      </p>

      <div aria-hidden="true">
        <div className="skeleton mb-4 h-control w-24 rounded-md" />
        <div className="grid items-start gap-6 xl:grid-cols-[13rem_minmax(0,1fr)_20rem]">
          <div className="min-w-0">
            <div className="flex h-[5.25rem] items-center sm:h-24 xl:mb-6 xl:block xl:h-auto">
              <div className="skeleton h-[clamp(2.25rem,5.4vw,3.4rem)] w-48 rounded-lg" />
            </div>
            <div className="hidden gap-1 xl:grid">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="skeleton h-11 rounded-xl" />
              ))}
            </div>
          </div>

          <div className="@container/menu-products min-w-0">
            <div className="skeleton h-12 rounded-md" />
            <div className="mt-4 flex gap-2 overflow-hidden xl:hidden">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="skeleton h-11 w-24 shrink-0 rounded-full" />
              ))}
            </div>
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 @min-[600px]/menu-products:grid-cols-3 @min-[880px]/menu-products:grid-cols-4">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                <MenuCardSkeleton key={i} />
              ))}
            </div>
          </div>

          <div className="hidden xl:block">
            <div className="skeleton h-40 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

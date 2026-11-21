import { Hairline } from "@/components/ui/hairline";

/**
 * Saved skeleton — page header, one "Your usual" preset card, the hairline,
 * then the favourite-drinks grid in MenuItemCard's shape.
 */
export default function Loading() {
  return (
    <div aria-busy="true">
      <p className="sr-only" role="status">
        Loading your saved drinks…
      </p>

      <div aria-hidden="true" className="py-2">
        <div className="mb-heading">
          <div className="skeleton display h-lh w-[2.6em] rounded-md text-6xl" />
        </div>

        <div className="flex flex-col gap-10">
          <div>
            <div className="skeleton display mb-3 h-lh w-[5em] rounded text-xl" />
            <div className="skeleton mb-4 h-lh w-64 max-w-full rounded text-sm" />

            <div className="rounded-lg border border-line bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                <div className="min-w-0">
                  <div className="skeleton display h-lh w-[7em] rounded text-lg" />
                  <div className="skeleton mt-0.5 h-lh w-40 rounded text-xs" />
                </div>
                <div className="flex shrink-0 gap-2">
                  <div className="skeleton h-9 w-32 rounded-md" />
                  <div className="skeleton h-9 w-20 rounded-md" />
                </div>
              </div>
              <div className="mt-3 flex flex-col gap-1 border-t border-line pt-3 text-sm">
                {[0, 1].map((i) => (
                  <div key={i} className="flex justify-between gap-4">
                    <div className="skeleton h-lh w-48 max-w-full rounded" />
                    <div className="skeleton h-lh w-16 shrink-0 rounded" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Hairline />

          <div>
            <div className="skeleton display mb-4 h-lh w-[8em] rounded text-xl" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex">
                  <div className="flex w-full gap-3 rounded-lg border border-line bg-card p-3 sm:flex-col sm:gap-0 sm:p-5">
                    <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:order-2 sm:items-center sm:gap-2 sm:pt-4">
                      <div className="skeleton eyebrow h-lh w-16 rounded" />
                      <div className="skeleton display menu-item-title h-lh w-[7em] max-w-full rounded text-lg sm:text-xl" />
                      <div className="skeleton h-lh w-24 rounded text-xs" />
                      <div className="mt-auto flex w-full flex-wrap items-end justify-between gap-2 pt-3 sm:flex-col sm:items-stretch sm:gap-3 sm:pt-5">
                        <div className="skeleton order-2 h-9 w-28 shrink-0 rounded-md sm:w-auto" />
                        <div className="order-1 flex flex-col sm:items-center">
                          <div className="skeleton h-lh w-16 rounded text-base" />
                          <div className="skeleton eyebrow mt-0.5 h-lh w-24 rounded" />
                        </div>
                      </div>
                    </div>
                    <div className="skeleton order-first aspect-square w-28 shrink-0 rounded-md sm:order-1 sm:w-full sm:rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

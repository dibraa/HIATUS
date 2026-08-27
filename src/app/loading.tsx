/**
 * Route-level loading state.
 *
 * Mirrors the storefront's real layout (hero block, then a product grid) so
 * the page does not visibly jump when content arrives. Marked `aria-busy` and
 * hidden from the accessibility tree — the skeleton carries no information, and
 * the status message below is what a screen reader should hear instead.
 */
export default function Loading() {
  return (
    <div aria-busy="true">
      <p className="sr-only" role="status">
        Loading…
      </p>

      <div aria-hidden="true" className="flex flex-col gap-10">
        <div className="skeleton h-72 rounded-xl sm:h-80" />

        <div>
          <div className="skeleton h-8 w-40 rounded-md" />
          <div className="mt-4 flex gap-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-9 w-24 rounded-full" />
            ))}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="skeleton h-32 rounded-lg sm:h-80" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

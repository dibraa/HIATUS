/**
 * Cart skeleton — the signed-in cart: heading, item rows, then the subtotal
 * card. Text bars use `h-lh` with the real text size so each is one line box.
 */
export default function Loading() {
  return (
    <div aria-busy="true">
      <p className="sr-only" role="status">
        Loading your cart…
      </p>

      <div aria-hidden="true" className="mx-auto max-w-2xl">
        <div className="skeleton display h-lh w-[5em] rounded-md text-2xl" />
        <div className="skeleton mt-1 h-lh w-14 rounded text-sm" />

        <div className="mt-6 flex flex-col gap-3">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="flex items-start gap-3 rounded-lg border border-line bg-card p-3 sm:gap-4"
            >
              <div className="skeleton aspect-square w-16 shrink-0 rounded-md sm:w-20" />

              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="skeleton h-lh w-36 max-w-full rounded text-sm" />
                <div className="skeleton eyebrow h-lh w-28 max-w-full rounded" />
                <div className="skeleton h-lh w-20 rounded text-sm" />
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  {/* QuantityStepper sm: two 44px buttons, a 32px value, 1px border */}
                  <div className="skeleton h-11 w-[122px] rounded-md" />
                  <div className="skeleton h-lh w-12 rounded text-xs" />
                </div>
              </div>

              <div className="skeleton h-lh w-16 shrink-0 rounded text-sm" />
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-lg border border-line bg-card p-5">
          <div className="flex items-center justify-between text-base">
            <div className="skeleton h-lh w-20 rounded" />
            <div className="skeleton h-lh w-20 rounded" />
          </div>
          <div className="skeleton mt-1 h-lh w-32 rounded text-xs" />
          <div className="skeleton mt-5 h-12 w-full rounded-md" />
          <div className="skeleton mx-auto mt-3 h-lh w-28 rounded text-xs" />
          <div className="mt-4 border-t border-line pt-4">
            <div className="skeleton h-lh w-36 rounded text-xs" />
          </div>
        </div>
      </div>
    </div>
  );
}

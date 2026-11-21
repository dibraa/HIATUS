/**
 * CheckoutForm's cards as placeholders: where (shown when both order types are
 * on, the default), payment, notes, and the order summary with its place-order
 * button. Used by the route's loading.tsx and by CheckoutForm itself until the
 * cart (localStorage) has hydrated, so the two never differ.
 */
export function CheckoutFormSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-5">
      <div className="rounded-lg border border-line bg-card p-5">
        <div className="skeleton display h-lh w-[11em] max-w-full rounded text-lg" />
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          {[0, 1].map((i) => (
            <div key={i} className="flex flex-1 flex-col gap-1 rounded-md border border-line-strong p-3.5">
              <div className="skeleton h-lh w-20 rounded text-sm" />
              <div className="ml-6 skeleton h-lh w-32 max-w-full rounded text-xs" />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-line bg-card p-5">
        <div className="skeleton display h-lh w-[4em] rounded text-lg" />
        <div className="skeleton mt-1 h-lh w-60 max-w-full rounded text-xs" />
        <div className="skeleton mt-4 h-lh w-12 rounded text-sm" />
      </div>

      <div className="rounded-lg border border-line bg-card p-5">
        <div className="skeleton display h-lh w-[11em] max-w-full rounded text-lg" />
        {/* rows={3} textarea: three text-sm lines, py-2.5 and a 1px border */}
        <div className="skeleton mt-4 h-[calc(3lh+1.25rem+2px)] w-full rounded-md text-sm" />
        <div className="skeleton mt-1.5 h-lh w-52 max-w-full rounded text-xs" />
      </div>

      <div className="rounded-lg border border-line bg-card p-5">
        <div className="skeleton eyebrow h-lh w-20 rounded" />
        <div className="mt-4 flex flex-col gap-2.5 text-sm">
          {[0, 1].map((i) => (
            <div key={i} className="flex justify-between gap-4">
              <div className="skeleton h-lh w-44 max-w-full rounded" />
              <div className="skeleton h-lh w-16 shrink-0 rounded" />
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-col gap-1.5 border-t border-line pt-4 text-sm">
          <div className="flex justify-between gap-4">
            <div className="skeleton h-lh w-16 rounded" />
            <div className="skeleton h-lh w-16 rounded" />
          </div>
          <div className="mt-1.5 flex items-center justify-between gap-4 border-t border-line pt-3">
            <div className="skeleton h-lh w-12 rounded text-base" />
            <div className="skeleton h-lh w-24 rounded text-xl" />
          </div>
        </div>
        <div className="skeleton mt-4 h-[calc(1lh+1.25rem)] w-full rounded-md text-sm" />
        <div className="skeleton mt-5 h-12 w-full rounded-md" />
        <div className="skeleton mx-auto mt-3 h-lh w-64 max-w-full rounded text-xs" />
      </div>
    </div>
  );
}

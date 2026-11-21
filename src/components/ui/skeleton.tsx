/**
 * Loading placeholders that are the SAME SHAPE as what they stand in for.
 *
 * A skeleton earns its place only if the page does not jump when the real
 * thing arrives, so each of these is measured against the primitive it
 * mirrors rather than guessed — the field is a label line, the label gap and
 * a control at `--spacing-control`, exactly the stack `TextField` renders.
 *
 * All decorative: the caller marks the region `aria-busy` and gives a screen
 * reader a `role="status"` line, so these carry `aria-hidden`.
 */
export function FieldSkeleton() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-1.5">
      {/* One line box of the label's own type, so the height is exact. */}
      <div className="skeleton ui-caps h-lh w-20 rounded-sm text-2xs" />
      <div className="skeleton h-control rounded-md" />
    </div>
  );
}

/** A button-shaped block, the height of a medium `Button`. */
export function ControlSkeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`skeleton h-control rounded-md ${className}`} />;
}

/** `MenuItemCard`'s shape: a photo-left row on phones, a centred column card
 *  from `sm`, with the same padding, border and radii. */
export function MenuCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="flex w-full gap-3 rounded-lg border border-line bg-card p-3 sm:flex-col sm:gap-0 sm:p-5"
    >
      <div className="skeleton aspect-square w-28 shrink-0 rounded-lg sm:w-full" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:items-center sm:gap-2 sm:pt-4">
        <div className="skeleton h-3 w-16 rounded-sm" />
        <div className="skeleton h-6 w-3/4 rounded-sm" />
        <div className="skeleton h-3 w-20 rounded-sm" />
        <div className="mt-auto flex w-full items-end justify-between gap-2 pt-3 sm:flex-col sm:items-stretch sm:gap-3 sm:pt-5">
          <div className="skeleton h-5 w-16 rounded-sm sm:mx-auto" />
          <ControlSkeleton className="w-24 sm:w-full" />
        </div>
      </div>
    </div>
  );
}

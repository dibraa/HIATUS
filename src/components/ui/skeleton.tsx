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
      <div className="skeleton h-4 w-20 rounded-sm" />
      <div className="skeleton h-control rounded-md" />
    </div>
  );
}

/** A button-shaped block, the height of a medium `Button`. */
export function ControlSkeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`skeleton h-control rounded-md ${className}`} />;
}

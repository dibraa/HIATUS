import { ControlSkeleton } from "@/components/ui/skeleton";

/** Session-unavailable skeleton — same narrow column, headline, message and
 *  button as the loaded page. `1lh` takes each line's height from the real
 *  type classes, so the fluid headline stays the right size. */
export default function Loading() {
  return (
    <div aria-busy="true">
      <p className="sr-only" role="status">
        Loading connection status…
      </p>
      <div aria-hidden="true" className="mx-auto max-w-lg py-12">
        <div className="display skeleton h-[1lh] w-[10em] max-w-full rounded-md text-4xl" />
        <div className="mt-4 flex flex-col">
          <div className="skeleton h-[1lh] w-full max-w-md rounded-sm" />
          {/* The message wraps to a second line on phones. */}
          <div className="skeleton h-[1lh] w-1/2 rounded-sm sm:hidden" />
        </div>
        <ControlSkeleton className="mt-6 w-32" />
      </div>
    </div>
  );
}

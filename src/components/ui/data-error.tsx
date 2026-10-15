import { RetryButton } from "./retry-button";

/**
 * What a data-fetching section shows when the fetch fails.
 *
 * The critical distinction: "Nothing here" (empty) and "Couldn't load"
 * (error) are different states with different next actions. An empty state
 * says "go create something"; an error state says "try again". Conflating
 * them — the old `.catch(() => [])` pattern — tells the user there is no
 * data when the real problem is the network.
 *
 * `showRetry` is optional because not every error is retryable (a 403, for
 * example). The retry behavior lives in a client component so server pages
 * can render this error without passing event handlers across the boundary.
 *
 * Colour comes from the measured danger badge pair (fg on its own bg is
 * 6.93:1), so the panel stays readable in both themes.
 */
export function DataError({
  title = "Couldn't load",
  body = "Something went wrong while fetching this data.",
  showRetry = false,
}: {
  title?: string;
  body?: string;
  showRetry?: boolean;
}) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-danger/30 bg-danger-soft-bg px-6 py-10 text-center"
    >
      <p className="display text-2xl text-danger-soft-fg">{title}</p>
      <p className="mx-auto mt-2 max-w-[44ch] text-sm text-danger-soft-fg/80">{body}</p>
      {showRetry && (
        <div className="mt-6 flex justify-center">
          <RetryButton />
        </div>
      )}
    </div>
  );
}

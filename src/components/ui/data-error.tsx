import { Button } from "./button";

/**
 * What a data-fetching section shows when the fetch fails.
 *
 * The critical distinction: "Nothing here" (empty) and "Couldn't load"
 * (error) are different states with different next actions. An empty state
 * says "go create something"; an error state says "try again". Conflating
 * them — the old `.catch(() => [])` pattern — tells the user there is no
 * data when the real problem is the network.
 *
 * `onRetry` is optional because not every error is retryable (a 403, for
 * example). When absent, the component renders without the button.
 */
export function DataError({
  title = "Couldn't load",
  body = "Something went wrong while fetching this data.",
  onRetry,
}: {
  title?: string;
  body?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-danger/30 bg-danger-soft-bg px-6 py-10 text-center"
    >
      <p className="display text-xl text-danger-fg">{title}</p>
      <p className="mx-auto mt-2 max-w-[44ch] text-sm text-danger-fg/80">{body}</p>
      {onRetry && (
        <div className="mt-6 flex justify-center">
          <Button variant="outline" size="md" onClick={onRetry}>
            Try again
          </Button>
        </div>
      )}
    </div>
  );
}

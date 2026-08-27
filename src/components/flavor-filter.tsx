import Link from "next/link";

/**
 * Flavour filter chips.
 *
 * Plain links rather than buttons: each filter state is a real URL, so it is
 * back-button-able, shareable and works without JavaScript. The active chip is
 * marked with `aria-current` so it is not identified by colour alone.
 *
 * On narrow screens the row scrolls horizontally instead of wrapping into three
 * stacked lines that would push the products below the fold.
 */
export function FlavorFilter({
  flavors,
  activeFlavor,
  /** Preserved in every chip href so filtering does not clear the search. */
  query,
}: {
  flavors: string[];
  activeFlavor?: string;
  query?: string;
}) {
  if (flavors.length === 0) return null;

  const hrefFor = (flavor?: string) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (flavor) params.set("flavor", flavor);
    const qs = params.toString();
    return `/${qs ? `?${qs}` : ""}#menu`;
  };

  const chip = (isActive: boolean) =>
    [
      "inline-flex h-9 shrink-0 items-center rounded-full border px-4 text-xs font-medium",
      "transition-colors duration-150 ease-hi",
      isActive
        ? "border-ink bg-ink text-accent-fg"
        : "border-line bg-card text-ink-soft hover:border-ink hover:text-ink",
    ].join(" ");

  return (
    // min-w-0 is load-bearing: this nav is a flex item, and a flex item's
    // default `min-width: auto` refuses to shrink below its content. Without
    // it the chip row forces the whole page wider than the viewport and the
    // body scrolls sideways, instead of the row scrolling inside itself.
    <nav aria-label="Filter drinks by flavour" className="min-w-0 flex-1">
      <ul className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        <li>
          <Link
            href={hrefFor()}
            aria-current={!activeFlavor ? "true" : undefined}
            className={chip(!activeFlavor)}
          >
            All drinks
          </Link>
        </li>

        {flavors.map((flavor) => {
          const isActive = flavor === activeFlavor;
          return (
            <li key={flavor}>
              <Link
                href={hrefFor(flavor)}
                aria-current={isActive ? "true" : undefined}
                className={chip(isActive)}
              >
                {flavor}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

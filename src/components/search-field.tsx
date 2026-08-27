import Form from "next/form";

/**
 * Menu search.
 *
 * A plain form targeting `/` with a `q` param — `next/form` upgrades the
 * submission to a client-side navigation (and prefetches the result route)
 * where JS is available, and falls back to a normal GET where it is not. The
 * filtering itself happens on the server in the page component, so search
 * works with JS disabled and every result set is a shareable URL.
 */
export function SearchField({
  query,
  /** Carried through so searching does not silently drop the active flavour filter. */
  flavor,
  className = "",
  id = "menu-search",
}: {
  query?: string;
  flavor?: string;
  className?: string;
  id?: string;
}) {
  return (
    <Form action="/" scroll={false} className={`relative ${className}`}>
      <label htmlFor={id} className="sr-only">
        Search the menu
      </label>

      <svg
        viewBox="0 0 20 20"
        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        aria-hidden="true"
      >
        <circle cx="9" cy="9" r="5.5" />
        <path d="M13.5 13.5L17 17" strokeLinecap="round" />
      </svg>

      <input
        id={id}
        type="search"
        name="q"
        defaultValue={query}
        placeholder="Search drinks or flavours"
        autoComplete="off"
        className="h-11 w-full rounded-full border border-line-strong bg-card pl-10 pr-20 text-sm text-ink placeholder:text-muted transition-colors duration-150 ease-hi hover:border-ink focus:border-ink focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      />

      {flavor && <input type="hidden" name="flavor" value={flavor} />}

      <button
        type="submit"
        className="absolute right-1.5 top-1/2 h-8 -translate-y-1/2 rounded-full bg-accent px-3.5 text-xs font-medium text-accent-fg transition-colors duration-150 ease-hi hover:bg-accent-hover"
      >
        Search
      </button>
    </Form>
  );
}

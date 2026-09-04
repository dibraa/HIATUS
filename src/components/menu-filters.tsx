import Link from "next/link";

/**
 * Menu filter chips: category on top, flavour beneath.
 *
 * Plain links rather than buttons — each filter state is a real URL, so it is
 * back-button-able, shareable, and works without JavaScript. The active chip is
 * marked with `aria-current` so it is never identified by colour alone.
 *
 * The two rows compose rather than reset each other. Picking a flavour keeps
 * the category, picking a category keeps the search, and each row's "All" clears
 * only its own dimension. Filters that silently wipe a sibling are the single
 * most common way a faceted menu becomes annoying to use.
 *
 * On narrow screens each row scrolls horizontally instead of wrapping into
 * three stacked lines that would push the products below the fold.
 */
export type MenuFilterState = {
  category?: string;
  flavor?: string;
  query?: string;
};

function buildHref(state: MenuFilterState): string {
  const params = new URLSearchParams();
  if (state.query) params.set("q", state.query);
  if (state.category) params.set("category", state.category);
  if (state.flavor) params.set("flavor", state.flavor);
  const qs = params.toString();
  return `/${qs ? `?${qs}` : ""}#menu`;
}

function chipClass(isActive: boolean, tone: "accent" | "green") {
  const active =
    tone === "accent"
      ? "border-accent bg-accent text-accent-fg"
      : "border-secondary bg-secondary text-secondary-fg";

  return [
    "inline-flex h-9 shrink-0 items-center whitespace-nowrap rounded-full border px-4 text-xs font-medium",
    "transition-colors duration-150 ease-hi",
    isActive
      ? active
      : "border-line-strong bg-card text-ink-soft hover:border-ink hover:text-ink",
  ].join(" ");
}

function ChipRow({
  label,
  values,
  active,
  tone,
  allLabel,
  hrefFor,
}: {
  label: string;
  values: string[];
  active?: string;
  tone: "accent" | "green";
  allLabel: string;
  hrefFor: (value?: string) => string;
}) {
  if (values.length === 0) return null;

  return (
    // min-w-0 is load-bearing: this nav is a flex item, and a flex item's
    // default `min-width: auto` refuses to shrink below its content. Without
    // it the chip row forces the whole page wider than the viewport and the
    // body scrolls sideways, instead of the row scrolling inside itself.
    <nav aria-label={label} className="min-w-0">
      <ul className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        <li>
          <Link
            href={hrefFor()}
            aria-current={!active ? "true" : undefined}
            className={chipClass(!active, tone)}
          >
            {allLabel}
          </Link>
        </li>

        {values.map((value) => (
          <li key={value}>
            <Link
              href={hrefFor(value)}
              aria-current={value === active ? "true" : undefined}
              className={chipClass(value === active, tone)}
            >
              {value}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function MenuFilters({
  categories,
  flavors,
  state,
}: {
  categories: string[];
  flavors: string[];
  state: MenuFilterState;
}) {
  return (
    <div className="flex flex-col gap-3">
      <ChipRow
        label="Filter drinks by category"
        values={categories}
        active={state.category}
        tone="green"
        allLabel="Everything"
        // Changing category drops the flavour: flavours are listed per
        // category, and keeping one that does not exist under the new category
        // would silently return nothing.
        hrefFor={(category) => buildHref({ query: state.query, category })}
      />

      <ChipRow
        label="Filter drinks by flavour"
        values={flavors}
        active={state.flavor}
        tone="accent"
        allLabel="All flavours"
        hrefFor={(flavor) =>
          buildHref({ query: state.query, category: state.category, flavor })
        }
      />
    </div>
  );
}

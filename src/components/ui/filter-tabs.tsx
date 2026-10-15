import Link from "next/link";

/**
 * Link-based segmented filter (admin date ranges, admin order tabs, the
 * staff queue's stage filter, the POS payment views).
 *
 * Links, not buttons, for the same reason the storefront's flavour chips are:
 * each state is a distinct URL, so it is shareable, back-button-correct, and
 * works with JavaScript disabled.
 *
 * `aria-current="page"` is what actually communicates the selection — the
 * espresso fill is the visual echo of it, not the source of truth.
 *
 * Each chip stands at the system control height (44px), so a row of these
 * lines up with a Button or a TextField beside it and clears the touch-target
 * size without needing the coarse-pointer fallback.
 */
export type FilterTab = {
  label: string;
  href: string;
  active: boolean;
  /** An optional figure beside the label — "Ready 3". Rendered in the display
   *  face so it reads as a count, not as part of the label. */
  count?: number;
};

const CHIP =
  "ui-caps inline-flex h-control items-center gap-2 whitespace-nowrap rounded-md border px-4 text-2xs transition-colors";

export function FilterTabs({
  tabs,
  label,
  className,
}: {
  tabs: FilterTab[];
  /** Names the group, e.g. "Filter orders by status". */
  label: string;
  className?: string;
}) {
  return (
    <nav aria-label={label} className={className}>
      {/* -mx-4 px-4 lets the row bleed to the screen edge on a narrow viewport
          while keeping the first chip aligned with the page gutter. min-w-0 on
          the items stops the row forcing horizontal page scroll. */}
      <ul className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-0.5">
        {tabs.map((tab) => (
          <li key={tab.href} className="min-w-0 shrink-0">
            <Link
              href={tab.href}
              aria-current={tab.active ? "page" : undefined}
              className={
                tab.active
                  ? `${CHIP} border-cta bg-cta text-cta-fg`
                  : `${CHIP} border-line-strong bg-card text-ink-soft hover:border-ink hover:text-ink`
              }
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="display text-lg leading-none">{tab.count}</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

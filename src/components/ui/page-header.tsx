import type { ReactNode } from "react";

/**
 * The heading block every non-storefront page opens with.
 *
 * One component keeps the level, size and spacing honest across ~20 pages, and
 * it is what carries the comp's display voice off the landing page: condensed
 * caps for the title, an optional tracked mono eyebrow above it, prose beneath.
 *
 * `as` exists because a heading's LEVEL is about document structure and its
 * SIZE is about visual weight; these must be settable apart or headings get
 * skipped to get a smaller size.
 *
 * The title is ONE size class rather than `text-3xl sm:text-4xl`: `text-4xl`
 * is fluid (30px -> 44px across 380-1280), so it covers the range the
 * breakpoint pair used to and stays continuous between the steps.
 *
 * The eyebrow sits at `snug` here and at `block` on the landing hero. That is
 * the same relationship at two scales — the gap under an eyebrow is read
 * against the size of the heading it introduces, and the hero's is more than
 * twice as tall.
 */
export function PageHeader({
  title,
  description,
  action,
  eyebrow,
  as: Tag = "h1",
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  /** Tracked mono label above the title — the section this page belongs to. */
  eyebrow?: string;
  as?: "h1" | "h2";
}) {
  return (
    <div className="mb-heading flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-snug text-muted">{eyebrow}</p>}

        <Tag className="display text-4xl text-ink">{title}</Tag>

        {description && (
          <p className="mt-snug max-w-[60ch] text-sm text-ink-soft">{description}</p>
        )}
      </div>

      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

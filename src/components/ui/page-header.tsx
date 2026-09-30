import type { ReactNode } from "react";

/**
 * The heading block every non-storefront page opens with.
 *
 * The title is the dominant element on the page — large Anton display type
 * that establishes hierarchy at a glance. Everything else on the page is
 * secondary to this.
 *
 * `as` exists because a heading's LEVEL is about document structure and its
 * SIZE is about visual weight; these must be settable apart or headings get
 * skipped to get a smaller size.
 */
export function PageHeader({
  title,
  description,
  action,
  as: Tag = "h1",
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  as?: "h1" | "h2";
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
      <div className="min-w-0">
        <Tag className="display text-5xl leading-[0.95] tracking-[-0.02em] text-ink sm:text-6xl">
          {title}
        </Tag>

        {description && (
          <p className="mt-3 max-w-[50ch] text-base text-muted">{description}</p>
        )}
      </div>

      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

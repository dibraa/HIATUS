import type { ReactNode } from "react";

/**
 * The heading block every non-storefront page opens with.
 *
 * These pages each rolled their own `font-serif text-2xl` heading, which was
 * pointing at a font family the app never loads — so they rendered in whatever
 * serif the browser defaults to, next to a storefront set entirely in Geist.
 * One component keeps the level, size and spacing honest.
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
    <div className="mb-6 flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
      <div>
        <Tag className="text-2xl font-semibold tracking-tight text-ink">{title}</Tag>
        {description && (
          <p className="mt-1.5 max-w-[60ch] text-sm text-muted">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

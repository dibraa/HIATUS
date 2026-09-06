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
  className = "",
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  as?: "h1" | "h2";
  className?: string;
}) {
  const headerClass = className ||
    "mb-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-4 border-b border-line pb-5";

  return (
    <div className={headerClass}>
      <div>
        <Tag className="text-3xl font-semibold tracking-[-0.02em] text-ink">{title}</Tag>
        {description && (
          <p className="mt-1.5 max-w-[60ch] text-sm text-muted">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

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
  size = "hero",
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  as?: "h1" | "h2";
  /** `hero` is the storefront headline. `utility` is for app screens where
   *  vertical space is at a premium — staff queue, POS, dashboards. */
  size?: "hero" | "utility";
}) {
  const sizeClasses =
    size === "hero"
      ? "text-5xl sm:text-6xl"
      : "text-2xl sm:text-3xl";

  return (
    <div className={size === "hero" ? "mb-8" : "mb-6"}>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <Tag className={`display ${sizeClasses} leading-[0.95] tracking-[-0.02em] text-ink`}>
            {title}
          </Tag>

          {description && (
            <p className="mt-2 max-w-[50ch] text-sm text-muted">{description}</p>
          )}
        </div>

        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}

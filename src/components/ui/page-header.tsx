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
 *
 * The sizes are single fluid steps from the type scale, not breakpoint
 * chains: `text-6xl` already runs 41 -> 74px with the viewport, and `.display`
 * already computes the optical tracking and line-height for whatever size it
 * lands on. Earlier versions re-applied `tracking-[-0.02em] leading-[0.95]`
 * here, which overrode that calc with one fixed value for every size — the
 * exact drift the stylesheet's "Type roles" block was written to prevent.
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
  const hero = size === "hero";

  return (
    // `mb-heading` (28 -> 40px) is the named heading-to-content gutter; a
    // utility header is a chrome element and sits one fixed `stack` (24px)
    // above its content instead.
    <div className={hero ? "mb-heading" : "mb-stack"}>
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <Tag className={`display text-ink ${hero ? "text-6xl" : "text-3xl"}`}>
            {title}
          </Tag>

          {description && (
            <p className="mt-tight max-w-[50ch] text-sm text-muted">{description}</p>
          )}
        </div>

        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}

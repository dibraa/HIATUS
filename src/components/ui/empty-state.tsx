import type { ReactNode } from "react";

/**
 * What a list shows when it has nothing to show.
 *
 * An empty state that only says "no results" is a dead end; this one takes an
 * `action` and the pages that use it are expected to pass one whenever there is
 * something useful to do.
 *
 * `as` sets the heading LEVEL independently of the styling, because an empty
 * state can appear under an h1 or nested inside an h2 section, and neither
 * should be forced to skip a level to look right.
 */
export function EmptyState({
  title,
  body,
  action,
  as: Tag = "h2",
  icon,
}: {
  title: string;
  body: string;
  action?: ReactNode;
  as?: "h2" | "h3";
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-line-strong bg-card px-6 py-14 text-center">
      {icon && (
        <div aria-hidden="true" className="mb-4 flex justify-center text-muted">
          {icon}
        </div>
      )}

      <Tag className="display text-2xl text-ink">{title}</Tag>

      {/* ~44 characters keeps the measure short enough to read as one thought */}
      <p className="mx-auto mt-3 max-w-[44ch] text-sm text-muted">{body}</p>

      {action && <div className="mt-7 flex justify-center">{action}</div>}
    </div>
  );
}

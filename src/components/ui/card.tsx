import type { ReactNode } from "react";

/**
 * A labelled card for grouping related content.
 *
 * Used by checkout (each step is a card), order detail (receipt, progress),
 * and anywhere else a titled container is needed. One component keeps the
 * padding, border, and heading rhythm consistent across all of them.
 */
export function Card({
  title,
  hint,
  children,
  as: Tag = "section",
}: {
  title: string;
  hint?: string;
  children: ReactNode;
  as?: "section" | "div";
}) {
  return (
    <Tag className="rounded-lg border border-line bg-card p-5">
      <h2 className="display text-lg text-ink">{title}</h2>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
      <div className="mt-4">{children}</div>
    </Tag>
  );
}

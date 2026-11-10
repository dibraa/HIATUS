"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

export function ReviewPagination({ items }: { items: ReactNode[] }) {
  const [requestedPage, setPage] = useState(1);
  const pageSize = 5;
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const page = Math.min(requestedPage, pageCount);
  return <div>
    <ul className="divide-y divide-line">{items.slice((page - 1) * pageSize, page * pageSize)}</ul>
    <nav aria-label="Review pages" className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
      <p className="text-sm text-muted" role="status">{items.length} {items.length === 1 ? "review" : "reviews"} &middot; Page {page} of {pageCount}</p>
      <div className="flex gap-2">
        <Button type="button" variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button>
        <Button type="button" variant="outline" disabled={page === pageCount} onClick={() => setPage(page + 1)}>Next</Button>
      </div>
    </nav>
  </div>;
}

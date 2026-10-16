"use client";

import { orderCode } from "@/lib/format";
import type { QueueOrder } from "@/types/staff";

export function IncomingOrders({
  incoming,
  onShow,
}: {
  incoming: QueueOrder[];
  onShow: () => void;
}) {
  if (incoming.length === 0) return null;
  return (
    <div className="ui-caps mb-3 flex min-h-11 items-center gap-3 px-1 text-2xs text-muted">
      <span className="min-w-0 truncate">
        {incoming.length} new · {incoming.map((o) => orderCode(o.id)).join(" · ")}
      </span>
      <button
        type="button"
        onClick={onShow}
        className="ui-caps ml-auto min-h-11 shrink-0 rounded-md px-3 text-2xs text-ink-soft transition-colors hover:bg-raised hover:text-ink"
      >
        Show
      </button>
    </div>
  );
}

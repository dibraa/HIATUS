"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { orderCode } from "@/lib/format";
import { HandOverPanel } from "./hand-over-panel";
import { IncomingOrders } from "./incoming-orders";
import { QueueRow } from "./queue-row";
import type { QueueOrder } from "@/types/staff";

type Props = {
  orders: QueueOrder[];
  renderedAt: string;
  lateAfter: number;
  overAfter: number;
  emptyTitle: string;
  emptyBody: string;
};

export function QueueBoard({ orders, renderedAt, lateAfter, overAfter, emptyTitle, emptyBody }: Props) {
  const [shown, setShown] = useState<Set<string>>(() => new Set(orders.map((o) => o.id)));
  const [handingOver, setHandingOver] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date(renderedAt).getTime());

  const visible = orders.filter((o) => shown.has(o.id));
  const incoming = orders.filter((o) => !shown.has(o.id));

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, 30_000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, []);

  const announcement = incoming.length
    ? `${incoming.length} new ${incoming.length === 1 ? "order" : "orders"}: ${incoming
        .map((o) => `${orderCode(o.id)} from ${o.profiles?.full_name?.trim() || "a walk-in"}`)
        .join(", ")}.`
    : "";

  const handOverOrder = orders.find((o) => o.id === handingOver) ?? null;

  return (
    <div className={`grid items-start gap-4 ${handOverOrder ? "lg:grid-cols-[minmax(0,1fr)_22rem]" : ""}`}>
      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>

      <div className="min-w-0">
        <IncomingOrders incoming={incoming} onShow={() => setShown(new Set(orders.map((o) => o.id)))} />

        {visible.length === 0 ? (
          <EmptyState
            title={emptyTitle}
            body={emptyBody}
            action={
              <Link
                href="/staff/pos"
                className="ui-caps inline-flex min-h-11 items-center rounded-md border border-line-strong px-4 text-2xs text-ink transition-colors hover:bg-raised"
              >
                Go to POS
              </Link>
            }
          />
        ) : (
          <ul
            className="divide-y divide-line overflow-hidden rounded-2xl bg-card ring-1 ring-line"
            style={{ top: "var(--staff-bar-h, 57px)" }}
          >
            {visible.map((order) => (
              <QueueRow
                key={order.id}
                order={order}
                now={now}
                lateAfter={lateAfter}
                overAfter={overAfter}
                selected={order.id === handingOver}
                onHandOver={() => setHandingOver(order.id)}
              />
            ))}
          </ul>
        )}
      </div>

      {handOverOrder && <HandOverPanel order={handOverOrder} onClose={() => setHandingOver(null)} />}
    </div>
  );
}

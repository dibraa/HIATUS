"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { orderCode } from "@/lib/format";
import { HandOverPanel } from "./hand-over-panel";
import { IncomingOrders } from "./incoming-orders";
import { QueueCard } from "./queue-card";
import { QueueReceiptModal } from "./queue-receipt-modal";
import type { QueueOrder } from "@/types/staff";

type Props = {
  orders: QueueOrder[];
  renderedAt: string;
  lateAfter: number;
  overAfter: number;
  emptyTitle: string;
  emptyBody: string;
  query: string;
};

/**
 * The counter workspace: a full-width ticket grid. Tapping a card opens its
 * centered receipt; the hand-over flow opens over the grid. The top bar's
 * global search arrives through the URL (?q=); stage stays in the URL too
 * via the filter tabs above.
 */
export function QueueBoard({ orders, renderedAt, lateAfter, overAfter, emptyTitle, emptyBody, query }: Props) {
  const [shown, setShown] = useState<Set<string>>(() => new Set(orders.map((o) => o.id)));
  const [handingOver, setHandingOver] = useState<string | null>(null);
  const [openCode, setOpenCode] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date(renderedAt).getTime());

  const visible = orders.filter((o) => shown.has(o.id));
  const incoming = orders.filter((o) => !shown.has(o.id));

  const term = query.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      term
        ? visible.filter((o) =>
            `${orderCode(o.id)} ${o.profiles?.full_name ?? ""}`.toLowerCase().includes(term)
          )
        : visible,
    [visible, term]
  );

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
  const openOrder = !handOverOrder ? orders.find((o) => o.id === openCode) ?? null : null;

  return (
    <div>
      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>

      <IncomingOrders incoming={incoming} onShow={() => setShown(new Set(orders.map((o) => o.id)))} />

      {term && (
        <p className="ui-caps mb-3 text-2xs text-muted">
          Filtered by <span className="text-ink">“{query.trim()}”</span> ·{" "}
          <Link href="/staff" className="underline underline-offset-4 hover:text-ink">
            Clear
          </Link>
        </p>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          title={term ? "No matches" : emptyTitle}
          body={term ? `Nothing matches "${query.trim()}".` : emptyBody}
          action={
            !term ? (
              <Link
                href="/staff/pos"
                className="ui-caps inline-flex min-h-11 items-center rounded-full bg-accent px-6 text-2xs text-accent-fg transition-colors hover:bg-accent-hover"
              >
                Go to POS
              </Link>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filtered.map((order) => (
            <QueueCard
              key={order.id}
              order={order}
              now={now}
              lateAfter={lateAfter}
              overAfter={overAfter}
              onOpen={() => setOpenCode(order.id)}
              onHandOver={() => setHandingOver(order.id)}
            />
          ))}
        </div>
      )}

      {openOrder && (
        <QueueReceiptModal
          order={openOrder}
          now={now}
          lateAfter={lateAfter}
          overAfter={overAfter}
          onClose={() => setOpenCode(null)}
          onHandOver={() => {
            setOpenCode(null);
            setHandingOver(openOrder.id);
          }}
        />
      )}

      {handOverOrder && <HandOverPanel order={handOverOrder} onClose={() => setHandingOver(null)} />}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/ui/empty-state";
import { orderCode } from "@/lib/format";
import { ACTIVE_STATUSES } from "@/lib/order-meta";
import { IncomingOrders } from "./incoming-orders";
import { QueueCard } from "./queue-card";
import { QueueReceiptModal } from "./queue-receipt-modal";
import { OrderDetail } from "./order-detail";
import type { QueueOrder } from "@/types/staff";

const LANES = [
  { status: "pending", label: "New", description: "Ready to start" },
  { status: "preparing", label: "Making", description: "At the coffee bar" },
  { status: "ready", label: "Ready", description: "Ready to hand over" },
] as const;

export function QueueBoard({
  orders,
  renderedAt,
  lateAfter,
  overAfter,
  query,
  stage,
  payment,
}: {
  orders: QueueOrder[];
  renderedAt: string;
  lateAfter: number;
  overAfter: number;
  query: string;
  stage: string;
  payment?: string;
}) {
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);
  const [shown, setShown] = useState(() => new Set(orders.map((o) => o.id)));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panel, setPanel] = useState<"payment" | "actions">("payment");
  const [busy, setBusy] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [now, setNow] = useState(() => new Date(renderedAt).getTime());
  const current =
    stage === "paid" || (stage === "history" && payment === "paid")
      ? "paid"
      : stage === "history"
        ? "history"
        : "active";
  const unpaidOnly = stage === "unpaid" || payment === "unpaid";
  const isActive = (o: QueueOrder) =>
    ACTIVE_STATUSES.includes(o.status) &&
    o.payment_status !== "refunded" &&
    o.payment_status !== "voided";
  const matches = (o: QueueOrder, view: string) =>
    view === "active"
      ? isActive(o)
      : view === "paid"
        ? o.payment_status === "paid"
        : !isActive(o);
  const incoming = orders.filter((o) => isActive(o) && !shown.has(o.id));
  const term = query.trim().toLowerCase();
  const filtered = orders
    .filter((o) => matches(o, current))
    .filter(
      (o) =>
        !unpaidOnly ||
        (o.payment_status === "unpaid" && o.status !== "cancelled"),
    )
    .filter((o) => current !== "active" || shown.has(o.id))
    .filter(
      (o) =>
        payment !== "reversed" ||
        o.payment_status === "refunded" ||
        o.payment_status === "voided",
    )
    .filter(
      (o) =>
        !term ||
        `${o.id} ${orderCode(o.id)} ${o.profiles?.full_name ?? ""} ${o.table_label ?? ""} ${o.order_items.map((i) => i.item_name).join(" ")}`
          .toLowerCase()
          .includes(term),
    )
    .sort((a, b) =>
      current === "active"
        ? (b.priority ?? 0) - (a.priority ?? 0) ||
          Date.parse(a.created_at) - Date.parse(b.created_at)
        : Date.parse(b.created_at) - Date.parse(a.created_at),
    );
  const selected = orders.find((o) => o.id === selectedId);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    function shortcut(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
        requestAnimationFrame(() => searchRef.current?.focus());
      }
    }
    window.addEventListener("keydown", shortcut);
    return () => {
      clearInterval(timer);
      window.removeEventListener("keydown", shortcut);
    };
  }, []);

  function href(view: string, unpaid = false) {
    const params = new URLSearchParams({ tab: view });
    if (query) params.set("q", query);
    if (unpaid) params.set("payment", "unpaid");
    return `/staff?${params}`;
  }
  function select(id: string, nextPanel: "payment" | "actions") {
    if (busy) return;
    setSelectedId(id);
    setPanel(nextPanel);
  }
  const card = (order: QueueOrder) => (
    <QueueCard
      key={order.id}
      order={order}
      now={now}
      lateAfter={lateAfter}
      overAfter={overAfter}
      disabled={busy}
      onPayment={() => select(order.id, "payment")}
      onMore={() => select(order.id, "actions")}
    />
  );
  return (
    <div>
      <div className="counter-view-bar">
        <nav aria-label="Order views" className="counter-view-tabs">
          {[
            { value: "active", label: "Active" },
            { value: "history", label: "History" },
            { value: "paid", label: "Paid" },
          ].map((view) => (
            <Link
              key={view.value}
              href={href(view.value)}
              aria-current={current === view.value ? "page" : undefined}
              onClick={(e) => {
                if (busy) e.preventDefault();
              }}
            >
              {view.label}
              {view.value !== "paid" && (
                <span className="numeric">
                  {orders.filter((o) => matches(o, view.value)).length}
                </span>
              )}
            </Link>
          ))}
        </nav>
        <div className="counter-refresh-tools">
          <button
            type="button"
            className="counter-search-toggle"
            aria-label="Search orders"
            aria-expanded={searchOpen || !!query}
            onClick={() => {
              setSearchOpen(!searchOpen);
              requestAnimationFrame(() => searchRef.current?.focus());
            }}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <circle cx="10" cy="10" r="6" />
              <path d="m15 15 5 5" />
            </svg>
          </button>
          <span className="counter-refresh">
            <span aria-hidden="true" />
            Refreshes every 15s
          </span>
        </div>
      </div>
      <div className="counter-payment-filters" aria-label="Payment filter">
        {[
          { unpaid: false, label: "All payments" },
          { unpaid: true, label: "Unpaid only" },
        ].map((filter) => (
          <Link
            key={filter.label}
            href={href(current, filter.unpaid)}
            aria-current={unpaidOnly === filter.unpaid ? "page" : undefined}
            onClick={(e) => {
              if (busy) e.preventDefault();
            }}
          >
            {filter.label}
          </Link>
        ))}
      </div>
      {(searchOpen || query) && (
        <form
          className="counter-search"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            const params = new URLSearchParams({ tab: current });
            if (unpaidOnly) params.set("payment", "unpaid");
            const q = String(data.get("q") ?? "").trim();
            if (q) params.set("q", q);
            router.push(`/staff?${params}`);
          }}
        >
          <label className="sr-only" htmlFor="counter-search">
            Search order, customer, item or table
          </label>
          <input
            ref={searchRef}
            id="counter-search"
            key={query}
            name="q"
            type="search"
            defaultValue={query}
            placeholder="Order, customer, item or table"
          />
          <button type="submit" disabled={busy}>
            Search
          </button>
          {query && (
            <Link
              href={`/staff?${new URLSearchParams({ tab: current, ...(unpaidOnly ? { payment: "unpaid" } : {}) })}`}
              onClick={(e) => {
                if (busy) e.preventDefault();
              }}
            >
              Clear
            </Link>
          )}
        </form>
      )}
      <p className="sr-only" role="status">
        {incoming.length
          ? `${incoming.length} new orders waiting to be shown.`
          : ""}
      </p>
      <IncomingOrders
        incoming={incoming}
        onShow={() => setShown(new Set(orders.map((o) => o.id)))}
      />
      {current === "active" ? (
        <div className="counter-lanes">
          {LANES.map((lane) => {
            const tickets = filtered.filter((o) => o.status === lane.status);
            return (
              <section
                key={lane.status}
                className={`counter-lane counter-lane-${lane.status}`}
                aria-labelledby={`lane-${lane.status}`}
              >
                <header className="counter-lane-heading">
                  <div>
                    <h2 id={`lane-${lane.status}`} className="display">
                      {lane.label}
                    </h2>
                    <p>{lane.description}</p>
                  </div>
                  <span
                    className="numeric counter-lane-count"
                    aria-label={`${tickets.length} ${lane.label.toLowerCase()} orders`}
                  >
                    {tickets.length}
                  </span>
                </header>
                <div className="counter-lane-tickets">
                  {tickets.length ? (
                    tickets.map(card)
                  ) : (
                    <p className="counter-lane-empty">
                      {term
                        ? "No matching orders."
                        : unpaidOnly
                          ? "No unpaid orders at this stage."
                          : "No orders at this stage."}
                    </p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      ) : filtered.length ? (
        <div className="counter-history-grid">{filtered.map(card)}</div>
      ) : (
        <EmptyState
          title={current === "paid" ? "No paid orders" : "No orders in history"}
          body="Orders will appear here as they are paid, completed, or cancelled. Adjust the payment filter or search to see more."
        />
      )}
      {selected && panel === "payment" && (
        <OrderDetail
          key={selected.id}
          order={selected}
          busy={busy}
          onBusyChange={setBusy}
          onClose={() => {
            if (!busy) setSelectedId(null);
          }}
          onDone={() => {
            setBusy(false);
            setSelectedId(null);
          }}
          onDetails={() => setPanel("actions")}
        />
      )}
      {selected && panel === "actions" && (
        <QueueReceiptModal
          key={selected.id}
          order={selected}
          now={now}
          lateAfter={lateAfter}
          overAfter={overAfter}
          onClose={() => setSelectedId(null)}
          onHandOver={() => setPanel("payment")}
        />
      )}
    </div>
  );
}

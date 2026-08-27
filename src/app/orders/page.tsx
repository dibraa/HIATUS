import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { ButtonLink } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import type { Order } from "@/types/database";

export const metadata: Metadata = { title: "My orders" };

/** One formatter for the whole page rather than one per row. */
const DATE_FORMAT = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default async function OrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: orders } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .returns<Order[]>();

  const orderList = orders ?? [];

  // Anything not yet handed over is what the customer opened this page for,
  // so it gets its own group above the history rather than being sorted in.
  const active = orderList.filter((o) =>
    ["pending", "preparing", "ready"].includes(o.status)
  );
  const past = orderList.filter((o) => !active.includes(o));

  return (
    <div className="mx-auto max-w-2xl py-2">
      <PageHeader
        title="My orders"
        description="Track what is being made and revisit anything you have ordered before."
      />

      {orderList.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line-strong bg-card px-6 py-14 text-center">
          <h2 className="text-lg font-semibold text-ink">No orders yet</h2>
          <p className="mx-auto mt-2 max-w-[44ch] text-sm text-muted">
            Once you order ahead, it shows up here with its live pickup status.
          </p>
          <div className="mt-6 flex justify-center">
            <ButtonLink href="/">Browse the menu</ButtonLink>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {active.length > 0 && (
            <OrderGroup title="In progress" orders={active} />
          )}
          {past.length > 0 && (
            <OrderGroup title={active.length > 0 ? "Earlier" : "All orders"} orders={past} />
          )}
        </div>
      )}
    </div>
  );
}

function OrderGroup({ title, orders }: { title: string; orders: Order[] }) {
  const headingId = `orders-${title.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId} className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted">
        {title}
      </h2>

      <ul className="flex flex-col gap-3">
        {orders.map((order) => (
          <li key={order.id}>
            {/* The whole row is the link, so the target is the full card
                rather than a "view" affordance the size of a word. */}
            <Link
              href={`/orders/${order.id}`}
              className="flex items-center justify-between gap-4 rounded-lg border border-line bg-card px-4 py-3.5 transition-colors duration-150 ease-hi hover:border-line-strong hover:bg-raised"
            >
              <span className="min-w-0">
                <span className="block text-sm font-medium text-ink">
                  <time dateTime={order.created_at}>
                    {DATE_FORMAT.format(new Date(order.created_at))}
                  </time>
                </span>
                <span className="mt-0.5 block text-sm tabular-nums text-muted">
                  {formatPrice(order.total_amount)}
                </span>
              </span>

              <OrderStatusBadge status={order.status} />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

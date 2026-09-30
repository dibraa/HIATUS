import Link from "next/link";
import type { Metadata } from "next";
import { getServerToken } from "@/lib/server-token";
import { apiJson } from "@/lib/api-client";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { DataError } from "@/components/ui/data-error";
import { formatPrice } from "@/lib/format";
import type { Order } from "@/types/database";

export const metadata: Metadata = { title: "My orders" };

const DATE_FORMAT = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" });

export default async function OrdersPage() {
  const token = await getServerToken();

  let orders: (Order & { _id: string })[];
  try {
    orders = await apiJson<(Order & { _id: string })[]>("/orders", { token: token ?? undefined });
  } catch {
    return (
      <div className="mx-auto max-w-2xl py-2">
        <PageHeader
          title="My orders"
          description="Track what is being made and revisit anything you have ordered before."
        />
        <DataError
          title="Couldn't load orders"
          body="Check your connection and try again."
        />
      </div>
    );
  }

  const orderList = orders.map((o) => ({ ...o, id: o._id ?? o.id }));
  const active = orderList.filter((o) => ["pending", "preparing", "ready"].includes(o.status));
  const past = orderList.filter((o) => !active.includes(o));

  return (
    <div className="mx-auto max-w-2xl py-2">
      <PageHeader
        title="My orders"
        description="Track what is being made and revisit anything you have ordered before."
      />

      {orderList.length === 0 ? (
        <EmptyState
          title="No orders yet"
          body="Once you order ahead, it shows up here with its live pickup status."
          action={<ButtonLink href="/">Browse the menu</ButtonLink>}
        />
      ) : (
        <div className="flex flex-col gap-8">
          {active.length > 0 && <OrderGroup title="In progress" orders={active} />}
          {past.length > 0 && <OrderGroup title={active.length > 0 ? "Earlier" : "All orders"} orders={past} />}
        </div>
      )}
    </div>
  );
}

function OrderGroup({ title, orders }: { title: string; orders: (Order & { id: string })[] }) {
  const headingId = `orders-${title.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId} className="mb-3 eyebrow text-muted">{title}</h2>
      <ul className="flex flex-col gap-3">
        {orders.map((order) => (
          <li key={order.id}>
            <Link
              href={`/orders/${order.id}`}
              className="flex items-center justify-between gap-4 rounded-lg border border-line bg-card px-4 py-3.5 transition-colors hover:border-line-strong hover:bg-raised"
            >
              <span className="min-w-0">
                <span className="block text-sm font-medium text-ink">
                  <time dateTime={order.created_at}>{DATE_FORMAT.format(new Date(order.created_at))}</time>
                </span>
                <span className="mt-0.5 block text-sm numeric text-muted">{formatPrice(order.total_amount)}</span>
              </span>
              <OrderStatusBadge status={order.status} />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

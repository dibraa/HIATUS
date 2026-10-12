import Link from "next/link";
import { OrderProgress } from "@/components/order-progress";
import { WaitEstimate } from "@/app/orders/[id]/wait-estimate";
import { formatPrice, orderCode } from "@/lib/format";
import type { ActiveOrder } from "@/lib/customer-data";

/**
 * The home page's first answer to a regular: "is my order ready?". On the
 * espresso card so it reads as the page's lead, with the same labelled steps
 * and countdown as the order page (their `inverse` tone), and one way through
 * to the full order.
 */
export function LiveOrderCard({ order, typicalMinutes }: { order: ActiveOrder; typicalMinutes: number }) {
  const summary = order.items?.length
    ? order.items.map((i) => (i.quantity && i.quantity > 1 ? `${i.quantity} × ${i.item_name}` : i.item_name)).join(" · ")
    : formatPrice(order.total_amount);

  return (
    <section
      aria-label={`Your order ${orderCode(order.id)}`}
      className="mt-6 grid gap-x-6 gap-y-4 rounded-2xl bg-inverse-card p-5 text-inverse-card-fg ring-1 ring-line sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:p-6"
    >
      <p className="display text-4xl leading-none sm:text-5xl">{orderCode(order.id)}</p>
      <div className="min-w-0">
        <p className="truncate text-sm text-inverse-card-muted">{summary}</p>
        <div className="mt-3">
          <OrderProgress status={order.status} tone="inverse" />
        </div>
        {order.status !== "ready" && (
          <WaitEstimate createdAt={order.created_at} typicalMinutes={typicalMinutes} tone="inverse" />
        )}
      </div>
      <Link
        href={`/orders/${order.id}`}
        className="ui-caps inline-flex min-h-11 items-center text-2xs text-inverse-card-fg underline-offset-4 hover:underline"
      >
        Track order &rarr;
      </Link>
    </section>
  );
}

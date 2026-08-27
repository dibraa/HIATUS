import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { formatPrice } from "@/lib/format";
import { getSizeOption } from "@/lib/sizes";
import type { Order, OrderItem, Rating } from "@/types/database";
import { RatingForm } from "./rating-form";
import { CancelButton } from "./cancel-button";

export const metadata: Metadata = { title: "Order details" };

const DATE_FORMAT = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeStyle: "short",
});

/** What the customer should do next, per state. Sits directly under the badge
 *  so the status is never left to be interpreted. */
const NEXT_STEP: Record<Order["status"], string> = {
  pending: "The shop has your order and will start it shortly.",
  preparing: "Being made now. We will mark it ready when it is on the counter.",
  ready: "Waiting on the counter for you. Pay cash when you collect it.",
  completed: "Collected. Thanks for ordering.",
  cancelled: "This order was cancelled and will not be charged.",
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .single<Order>();

  if (!order) notFound();

  const [{ data: items }, { data: existingRatings }] = await Promise.all([
    supabase.from("order_items").select("*").eq("order_id", id).returns<OrderItem[]>(),
    supabase.from("ratings").select("*").eq("order_id", id).returns<Rating[]>(),
  ]);

  const lines = items ?? [];
  const ratedItemIds = new Set((existingRatings ?? []).map((r) => r.menu_item_id));
  const rateable = lines.filter(
    (item) => item.menu_item_id && !ratedItemIds.has(item.menu_item_id)
  );

  return (
    <div className="mx-auto max-w-2xl py-2">
      {/* Back link, not a full breadcrumb: this page has exactly one parent. */}
      <Link
        href="/orders"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors duration-150 ease-hi hover:text-ink"
      >
        <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M10 3L5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        All orders
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Order details</h1>
          <p className="mt-1.5 text-sm text-muted">
            <time dateTime={order.created_at}>
              {DATE_FORMAT.format(new Date(order.created_at))}
            </time>
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <p className="mt-4 rounded-lg border border-line bg-raised px-4 py-3 text-sm text-ink-soft">
        {NEXT_STEP[order.status]}
      </p>

      {/* ---------- Line items ---------- */}
      <section aria-labelledby="items-heading" className="mt-6">
        <h2 id="items-heading" className="sr-only">
          Items in this order
        </h2>

        <ul className="divide-y divide-line rounded-lg border border-line bg-card">
          {lines.map((item) => (
            <li key={item.id} className="flex items-baseline justify-between gap-4 px-4 py-3">
              <span className="min-w-0 text-sm text-ink">
                <span className="tabular-nums text-muted">{item.quantity}&times;</span>{" "}
                {item.item_name}
                {/* Size is optional on the type — rows predating the pricing
                    patch have none, and "Medium" would be a guess there. */}
                {item.size && (
                  <span className="text-muted"> &middot; {getSizeOption(item.size).label}</span>
                )}
              </span>
              <span className="shrink-0 text-sm tabular-nums text-ink-soft">
                {formatPrice(item.subtotal)}
              </span>
            </li>
          ))}

          <li className="flex items-baseline justify-between gap-4 bg-raised px-4 py-3.5">
            <span className="text-base font-semibold text-ink">Total</span>
            <span className="text-base font-semibold tabular-nums text-ink">
              {formatPrice(order.total_amount)}
            </span>
          </li>
        </ul>

        {order.pickup_note && (
          <p className="mt-3 text-sm text-muted">
            <span className="font-medium text-ink-soft">Note for the shop:</span>{" "}
            &ldquo;{order.pickup_note}&rdquo;
          </p>
        )}
      </section>

      {/* Only offered while it is still true — the server enforces the same
          rule, this just avoids showing a button that would be refused. */}
      {order.status === "pending" && (
        <div className="mt-6">
          <CancelButton orderId={order.id} />
        </div>
      )}

      {/* ---------- Ratings ---------- */}
      {order.status === "completed" && (
        <section aria-labelledby="rate-heading" className="mt-10">
          <h2 id="rate-heading" className="text-lg font-semibold tracking-tight text-ink">
            Rate your order
          </h2>
          <p className="mt-1.5 text-sm text-muted">
            Ratings show on the menu and help the next person choose.
          </p>

          <div className="mt-4 flex flex-col gap-3">
            {rateable.length === 0 ? (
              <p className="text-sm text-muted">
                You&apos;ve rated everything in this order. Thanks!
              </p>
            ) : (
              rateable.map((item) => (
                <RatingForm
                  key={item.id}
                  orderId={order.id}
                  menuItemId={item.menu_item_id!}
                  itemName={item.item_name}
                />
              ))
            )}
          </div>
        </section>
      )}
    </div>
  );
}

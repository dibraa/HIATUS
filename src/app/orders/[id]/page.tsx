import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { OrderProgress } from "@/components/order-progress";
import { Badge } from "@/components/ui/badge";
import { CheckerBand } from "@/components/ui/checker";
import { formatPrice, formatDateTime, orderCode } from "@/lib/format";
import { getSizeOption } from "@/lib/sizes";
import { getSettings } from "@/lib/settings";
import {
  ORDER_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
} from "@/lib/order-meta";
import type { Order, OrderItem, Rating, WaitTimeStats } from "@/types/database";
import { RatingForm } from "./rating-form";
import { CancelButton } from "./cancel-button";
import { WaitEstimate } from "./wait-estimate";
import { AutoRefresh } from "@/components/auto-refresh";

export const metadata: Metadata = { title: "Order details" };

export const dynamic = "force-dynamic";

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

  const [{ data: items }, { data: existingRatings }, { data: waitRows }, settings] =
    await Promise.all([
      supabase.from("order_items").select("*").eq("order_id", id).returns<OrderItem[]>(),
      supabase.from("ratings").select("*").eq("order_id", id).returns<Rating[]>(),
      supabase.rpc("wait_time_stats", { days_back: 7 }),
      getSettings(),
    ]);

  const lines = items ?? [];
  const ratedItemIds = new Set((existingRatings ?? []).map((r) => r.menu_item_id));
  const rateable = lines.filter(
    (item) => item.menu_item_id && !ratedItemIds.has(item.menu_item_id)
  );

  const waits = (waitRows as WaitTimeStats[] | null)?.[0];
  const typicalMinutes =
    waits && waits.sample_size >= 5
      ? waits.median_minutes
      : settings.ordering.default_prep_minutes;

  const isActive = ["pending", "preparing"].includes(order.status);
  const template = settings.templates;
  const statusMessage = {
    pending: template.order_accepted,
    preparing: template.order_preparing,
    ready: template.order_ready,
    completed: template.order_completed,
    cancelled: "This order was cancelled and will not be charged.",
  }[order.status];

  return (
    <div className="mx-auto max-w-2xl py-2">
      {/* Only polls while there is something to wait for. A completed order
          will not change, and polling it forever is pure waste. */}
      {["pending", "preparing", "ready"].includes(order.status) && (
        <AutoRefresh seconds={20} />
      )}

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
          <h1 className="text-3xl font-semibold tracking-tight text-ink">
            Order {orderCode(order.id)}
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            <time dateTime={order.created_at}>
              {formatDateTime(order.created_at)}
            </time>
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      {/* ---------- Live status ---------- */}
      <section
        aria-labelledby="status-heading"
        className="mt-6 overflow-hidden rounded-lg border border-line bg-card"
      >
        <CheckerBand size="sm" className="h-1.5" />

        <div className="p-5">
          <h2 id="status-heading" className="sr-only">
            Order status
          </h2>

          {order.status !== "cancelled" && (
            <div className="mb-5">
              <OrderProgress status={order.status} />
            </div>
          )}

          {/* aria-live: this text changes underneath the reader as the order
              advances, and that change is the whole point of the page. */}
          <p aria-live="polite" className="text-base text-ink">
            {statusMessage}
          </p>

          {isActive && (
            <WaitEstimate
              createdAt={order.created_at}
              typicalMinutes={typicalMinutes}
            />
          )}

          {order.status === "ready" && order.order_type === "takeout" && (
            <p className="mt-2 text-sm text-muted">
              Come to the counter and give the code{" "}
              <span className="font-mono font-semibold text-ink">
                {orderCode(order.id)}
              </span>
              .
            </p>
          )}
        </div>
      </section>

      {/* ---------- Receipt ---------- */}
      <section aria-labelledby="receipt-heading" className="mt-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 id="receipt-heading" className="text-xl font-semibold tracking-tight text-ink">
            Receipt
          </h2>

          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={order.order_type === "dine_in" ? "green" : "neutral"}>
              {ORDER_TYPE_LABELS[order.order_type]}
              {order.table_label && ` · ${order.table_label}`}
            </Badge>
            <Badge tone={order.payment_status === "paid" ? "success" : "warning"}>
              {PAYMENT_STATUS_LABELS[order.payment_status]} ·{" "}
              {PAYMENT_METHOD_LABELS[order.payment_method]}
            </Badge>
          </div>
        </div>

        <div className="rounded-lg border border-line bg-card">
          <ul className="divide-y divide-line">
            {lines.map((item) => (
              <li
                key={item.id}
                className="flex items-baseline justify-between gap-4 px-4 py-3"
              >
                <span className="min-w-0 text-sm text-ink">
                  <span className="tabular-nums text-muted">{item.quantity}&times;</span>{" "}
                  {item.item_name}
                  {/* Size is optional on the type — rows predating the pricing
                      patch have none, and "Medium" would be a guess there. */}
                  {item.size && (
                    <span className="text-muted">
                      {" "}
                      &middot; {getSizeOption(item.size).label}
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-sm tabular-nums text-ink-soft">
                  {formatPrice(item.subtotal)}
                </span>
              </li>
            ))}
          </ul>

          <dl className="flex flex-col gap-1.5 border-t border-line px-4 py-3.5 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Subtotal</dt>
              <dd className="tabular-nums text-ink-soft">
                {formatPrice(order.subtotal_amount || order.total_amount)}
              </dd>
            </div>

            {order.discount_amount > 0 && (
              <div className="flex justify-between gap-4">
                <dt className="text-muted">
                  Discount{order.promo_code ? ` (${order.promo_code})` : ""}
                </dt>
                <dd className="tabular-nums text-success">
                  −{formatPrice(order.discount_amount)}
                </dd>
              </div>
            )}

            <div className="mt-1 flex items-baseline justify-between gap-4 border-t border-line pt-3">
              <dt className="text-base font-semibold text-ink">Total</dt>
              <dd className="text-base font-semibold tabular-nums text-ink">
                {formatPrice(order.total_amount)}
              </dd>
            </div>
          </dl>
        </div>

        {order.pickup_note && (
          <p className="mt-3 text-sm text-muted">
            <span className="font-medium text-ink-soft">Your note:</span> &ldquo;
            {order.pickup_note}&rdquo;
          </p>
        )}

        <p className="mt-3 text-xs text-muted">
          Keep this page for your records — it is your receipt. To save a copy,
          use your browser&rsquo;s Print &rarr; Save as PDF.
        </p>
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
          <h2 id="rate-heading" className="text-xl font-semibold tracking-tight text-ink">
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

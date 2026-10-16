import type { Metadata } from "next";
import { getServerToken } from "@/lib/server-token";
import { apiJson } from "@/lib/api-client";
import { getSettings } from "@/lib/settings";
import { formatPrice } from "@/lib/format";
import { DataError } from "@/components/ui/data-error";
import { ACTIVE_STATUSES } from "@/lib/order-meta";
import { USE_MOCKS, MOCK_QUEUE } from "@/lib/mock-staff-data";
import type { OrderItem } from "@/types/database";
import type { QueueOrder } from "@/types/staff";
import { QueueBoard } from "./queue-board";
import { AutoRefresh } from "@/components/auto-refresh";

export const metadata: Metadata = { title: "The Counter" };
export const dynamic = "force-dynamic";

export default async function StaffQueuePage({
  searchParams,
}: {
  searchParams: Promise<{
    tab?: string;
    q?: string;
    view?: string;
    payment?: string;
  }>;
}) {
  const { tab, q = "", view, payment } = await searchParams;
  // Existing payment bookmarks still resolve into the combined workspace.
  const stage =
    tab ??
    (view === "payments"
      ? payment === "paid" || payment === "reversed"
        ? "history"
        : "unpaid"
      : "active");
  let allOrders: QueueOrder[];
  let prep = 10;

  if (USE_MOCKS) {
    allOrders = MOCK_QUEUE;
  } else {
    const token = (await getServerToken()) ?? undefined;
    try {
      const [fetched, settings] = await Promise.all([
        apiJson<
          (QueueOrder & {
            _id: string;
            items?: (OrderItem & { _id?: string })[];
            user_id?: QueueOrder["profiles"];
          })[]
        >("/orders", { token }),
        getSettings(),
      ]);
      prep = settings.ordering.default_prep_minutes;
      allOrders = fetched.map((o) => ({
        ...o,
        id: o._id ?? o.id,
        order_items: (o.items ?? o.order_items ?? []).map(
          (item: OrderItem & { _id?: string }) => ({
            ...item,
            id: item._id ?? item.id,
          }),
        ),
        profiles: o.user_id ?? o.profiles ?? null,
      }));
    } catch {
      return (
        <div>
          <AutoRefresh seconds={15} />
          <DataError
            title="Couldn't load Queue & POS"
            body="Check your connection and try again."
            showRetry
          />
        </div>
      );
    }
  }

  const open = allOrders.filter(
    (o) =>
      ACTIVE_STATUSES.includes(o.status) &&
      o.payment_status !== "refunded" &&
      o.payment_status !== "voided",
  );
  const renderedAt = new Date();
  const toCollect = allOrders
    .filter((o) => o.status !== "cancelled" && o.payment_status === "unpaid")
    .reduce((s, o) => s + o.total_amount, 0);

  return (
    <div>
      <AutoRefresh seconds={15} />
      <div className="counter-page-heading">
        <div>
          <p className="ui-caps counter-page-kicker">
            Made for the morning rush
          </p>
          <h1 className="display">The Counter</h1>
          <p className="counter-page-description">
            Make it. Settle it. Hand it over.
          </p>
        </div>
        <dl className="counter-summary">
          <div>
            <dd className="display">{open.length}</dd>
            <dt>Active orders</dt>
          </div>
          <div>
            <dd className="display text-accent-ink">
              {
                allOrders.filter(
                  (o) =>
                    o.status !== "cancelled" && o.payment_status === "unpaid",
                ).length
              }
            </dd>
            <dt>Awaiting payment</dt>
          </div>
          <div>
            <dd className="numeric counter-outstanding">
              {formatPrice(toCollect)}
            </dd>
            <dt>Outstanding</dt>
          </div>
        </dl>
      </div>
      <QueueBoard
        orders={allOrders}
        renderedAt={renderedAt.toISOString()}
        lateAfter={prep}
        overAfter={Math.round(prep * 1.5)}
        query={q}
        stage={stage}
        payment={payment}
      />
    </div>
  );
}

import type { Metadata } from "next";
import { getServerToken } from "@/lib/server-token";
import { apiJson } from "@/lib/api-client";
import { getSettings } from "@/lib/settings";
import { DataError } from "@/components/ui/data-error";
import { USE_MOCKS, MOCK_QUEUE } from "@/lib/mock-staff-data";
import type { OrderItem } from "@/types/database";
import type { QueueOrder } from "@/types/staff";
import { QueueBoard } from "./queue-board";
import { AutoRefresh } from "@/components/auto-refresh";
import { StaffPageHeading } from "./staff-page-heading";

export const metadata: Metadata = { title: "Counter" };
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
        <div className="counter-page">
          <AutoRefresh seconds={15} />
          <StaffPageHeading title="Counter" />
          <div className="pt-4">
            <DataError
              title="Couldn't load the counter"
              body="Check your connection and try again."
              showRetry
            />
          </div>
        </div>
      );
    }
  }

  const renderedAt = new Date();

  return (
    <div className="counter-page">
      <AutoRefresh seconds={15} />
      {/* One header row; each lane carries its own count. */}
      <StaffPageHeading title="Counter" />
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

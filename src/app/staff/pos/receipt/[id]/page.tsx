import Link from "next/link";
import type { Metadata } from "next";
import { getServerToken } from "@/lib/server-token";
import { apiJson } from "@/lib/api-client";
import { getSettings } from "@/lib/settings";
import { formatDateTime, formatPrice, orderCode } from "@/lib/format";
import { PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/order-meta";
import { USE_MOCKS, MOCK_QUEUE } from "@/lib/mock-staff-data";
import { DataError } from "@/components/ui/data-error";
import type { Order, OrderItem, PaymentMethod } from "@/types/database";
import { PrintReceiptButton } from "./print-receipt-button";

export const metadata: Metadata = { title: "Receipt" };
export const dynamic = "force-dynamic";

type ReceiptPayment = {
  _id?: string;
  id?: string;
  kind: "payment" | "refund" | "void";
  method: PaymentMethod;
  amount: number;
  reference: string | null;
  reason?: string | null;
  created_at: string;
};

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const settings = await getSettings();

  let order: Order & { id: string; items: (OrderItem & { id: string })[] };
  let payment: ReceiptPayment | undefined;
  let transactions: ReceiptPayment[] = [];

  if (USE_MOCKS) {
    const mock = MOCK_QUEUE.find((o) => o.id === id);
    if (!mock) {
      return (
        <main className="mx-auto max-w-md px-5 py-8">
          <DataError
            title="Order not found"
            body="No ticket with that code exists in the preview queue."
          />
        </main>
      );
    }
    order = {
      id: mock.id,
      user_id: "",
      status: mock.status,
      subtotal_amount:
        mock.subtotal_amount ?? mock.total_amount + mock.discount_amount,
      discount_amount: mock.discount_amount,
      total_amount: mock.total_amount,
      pickup_note: mock.pickup_note,
      order_type: mock.order_type,
      table_label: mock.table_label,
      priority: mock.priority,
      payment_method: mock.payment_method,
      payment_status: mock.payment_status,
      paid_at: mock.payment_status === "paid" ? mock.created_at : null,
      ready_at: null,
      created_at: mock.created_at,
      updated_at: mock.created_at,
      items: mock.order_items.map((item) => ({ ...item })),
    };
    payment =
      mock.payment_status === "paid"
        ? {
            kind: "payment",
            method: mock.payment_method,
            amount: mock.total_amount,
            reference: null,
            created_at: mock.created_at,
          }
        : undefined;
    transactions = payment ? [payment] : [];
  } else {
    const token = await getServerToken();
    const data = await Promise.all([
      apiJson<Record<string, unknown>>(`/orders/${id}`, {
        token: token ?? undefined,
      }),
      apiJson<ReceiptPayment[]>(`/orders/${id}/payments`, {
        token: token ?? undefined,
      }),
    ]).catch(() => null);
    if (!data)
      return (
        <DataError
          title="Couldn't load this receipt"
          body="The order or transaction records couldn't be retrieved. Try again before issuing a receipt."
          showRetry
        />
      );
    const [rawOrder, payments] = data;
    transactions = payments;

    order = {
      ...(rawOrder as object),
      id: (rawOrder._id ?? rawOrder.id) as string,
      items: ((rawOrder.items ?? []) as (OrderItem & { _id?: string })[]).map(
        (item) => ({
          ...item,
          id: item._id ?? item.id,
        }),
      ),
    } as unknown as Order & {
      id: string;
      items: (OrderItem & { id: string })[];
    };
    payment = payments.find((entry) => entry.kind === "payment");
  }

  return (
    <main className="payment-receipt mx-auto max-w-md px-5 py-8 print:max-w-none print:px-0 print:py-0">
      <div className="mb-5 flex items-center justify-between print:hidden">
        <Link
          href="/staff/pos?tab=paid"
          className="ui-caps text-2xs text-muted hover:text-ink"
        >
          ← Settled orders
        </Link>
        {payment && <PrintReceiptButton />}
      </div>

      <article className="rounded-lg border border-line bg-card p-6 print:border-0 print:p-0">
        <header className="border-b border-line pb-5 text-center">
          <h1 className="display text-3xl text-ink">
            {settings.shopInfo.name}
          </h1>
          <p className="mt-1 text-xs text-muted">
            {payment ? "Payment receipt" : "Order record — no payment received"}
          </p>
          <p className="mt-3 font-mono text-sm text-ink">
            {orderCode(order.id)}
          </p>
        </header>
        {order.payment_status !== "paid" && (
          <p className="mt-4 rounded-md border border-line-strong p-3 text-sm font-semibold text-ink">
            {PAYMENT_STATUS_LABELS[order.payment_status]}
            {!payment
              ? " · This is not a payment receipt."
              : " · Original payment and reversals are listed below."}
          </p>
        )}

        <dl className="flex flex-col gap-1 border-b border-line py-4 text-sm">
          {payment ? (
            <>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Paid</dt>
                <dd className="text-right text-ink">
                  {formatDateTime(payment.created_at)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Method</dt>
                <dd className="text-ink">
                  {PAYMENT_METHOD_LABELS[payment.method]}
                </dd>
              </div>
            </>
          ) : (
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Status</dt>
              <dd className="font-medium text-warning">
                Unpaid at the counter
              </dd>
            </div>
          )}
          {payment?.reference && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Reference</dt>
              <dd className="text-ink">{payment.reference}</dd>
            </div>
          )}
        </dl>

        <ul className="divide-y divide-line py-2">
          {order.items.map((item) => (
            <li
              key={item.id}
              className="flex justify-between gap-4 py-2 text-sm"
            >
              <span className="text-ink-soft">
                {item.quantity}× {item.item_name}
              </span>
              <span className="numeric text-ink">
                {formatPrice(item.subtotal)}
              </span>
            </li>
          ))}
        </ul>

        <dl className="flex flex-col gap-1.5 border-t border-line pt-4 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Subtotal</dt>
            <dd className="numeric text-ink-soft">
              {formatPrice(order.subtotal_amount ?? order.total_amount)}
            </dd>
          </div>
          {order.discount_amount > 0 && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Discount</dt>
              <dd className="numeric text-success">
                −{formatPrice(order.discount_amount)}
              </dd>
            </div>
          )}
          <div className="mt-1 flex justify-between border-t border-line pt-3">
            <dt className="display text-xl text-ink">
              {payment ? "Total paid" : "Total due"}
            </dt>
            <dd className="numeric text-lg font-semibold text-ink">
              {formatPrice(
                payment?.amount ??
                  (order.status === "cancelled" ? 0 : order.total_amount),
              )}
            </dd>
          </div>
        </dl>
        {transactions.length > 0 && (
          <section
            className="mt-5 border-t border-line pt-4"
            aria-label="Transaction history"
          >
            <h2 className="text-sm font-semibold text-ink">
              Transaction history
            </h2>
            <ul className="mt-2 space-y-3">
              {transactions.map((entry, index) => (
                <li
                  key={entry._id ?? entry.id ?? index}
                  className="text-xs text-ink-soft"
                >
                  <p className="flex justify-between gap-4">
                    <strong className="capitalize">
                      {entry.kind} · {PAYMENT_METHOD_LABELS[entry.method]}
                    </strong>
                    <span className="numeric">{formatPrice(entry.amount)}</span>
                  </p>
                  <p className="mt-1">{formatDateTime(entry.created_at)}</p>
                  <p className="mt-1 break-all">
                    Transaction: {entry._id ?? entry.id ?? "Preview"}
                  </p>
                  {entry.reason && (
                    <p className="mt-1">Reason: {entry.reason}</p>
                  )}
                </li>
              ))}
            </ul>
            <p className="mt-4 flex justify-between border-t border-line pt-3 text-sm font-semibold text-ink">
              <span>Net paid</span>
              <span className="numeric">
                {formatPrice(
                  transactions.reduce(
                    (sum, entry) =>
                      sum +
                      (entry.kind === "payment" ? entry.amount : -entry.amount),
                    0,
                  ),
                )}
              </span>
            </p>
          </section>
        )}

        <footer className="mt-6 border-t border-line pt-4 text-center text-xs text-muted">
          Thank you for ordering from {settings.shopInfo.name}.
        </footer>
      </article>
    </main>
  );
}

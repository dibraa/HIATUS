import Link from "next/link";
import type { Metadata } from "next";
import { getServerToken } from "@/lib/server-token";
import { apiJson } from "@/lib/api-client";
import { getSettings } from "@/lib/settings";
import { formatDateTime, formatPrice, orderCode } from "@/lib/format";
import { PAYMENT_METHOD_LABELS } from "@/lib/order-meta";
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
  created_at: string;
};

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = await getServerToken();
  const [rawOrder, payments, settings] = await Promise.all([
    apiJson<Record<string, unknown>>(`/orders/${id}`, { token: token ?? undefined }),
    apiJson<ReceiptPayment[]>(`/orders/${id}/payments`, { token: token ?? undefined }),
    getSettings(),
  ]);

  const order = {
    ...rawOrder,
    id: (rawOrder._id ?? rawOrder.id) as string,
    items: ((rawOrder.items ?? []) as (OrderItem & { _id?: string })[]).map((item) => ({
      ...item,
      id: item._id ?? item.id,
    })),
  } as unknown as Order & { id: string; items: (OrderItem & { id: string })[] };
  const payment = payments.find((entry) => entry.kind === "payment") ?? payments[0];
  if (!payment) throw new Error("No payment record exists for this order.");

  return (
    <main className="mx-auto max-w-md px-5 py-8 print:max-w-none print:px-0 print:py-0">
      <div className="mb-5 flex items-center justify-between print:hidden">
        <Link href="/staff/pos?tab=paid" className="ui-caps text-2xs text-muted hover:text-ink">
          ← Settled orders
        </Link>
        <PrintReceiptButton />
      </div>

      <article className="rounded-lg border border-line bg-card p-6 print:border-0 print:p-0">
        <header className="border-b border-line pb-5 text-center">
          <h1 className="display text-3xl text-ink">{settings.shopInfo.name}</h1>
          <p className="mt-1 text-xs text-muted">Payment receipt</p>
          <p className="mt-3 font-mono text-sm text-ink">{orderCode(order.id)}</p>
        </header>

        <dl className="flex flex-col gap-1 border-b border-line py-4 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Paid</dt>
            <dd className="text-right text-ink">{formatDateTime(payment.created_at)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Method</dt>
            <dd className="text-ink">{PAYMENT_METHOD_LABELS[payment.method]}</dd>
          </div>
          {payment.reference && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Reference</dt>
              <dd className="text-ink">{payment.reference}</dd>
            </div>
          )}
        </dl>

        <ul className="divide-y divide-line py-2">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-4 py-2 text-sm">
              <span className="text-ink-soft">{item.quantity}× {item.item_name}</span>
              <span className="numeric text-ink">{formatPrice(item.subtotal)}</span>
            </li>
          ))}
        </ul>

        <dl className="flex flex-col gap-1.5 border-t border-line pt-4 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Subtotal</dt>
            <dd className="numeric text-ink-soft">{formatPrice(order.subtotal_amount || order.total_amount)}</dd>
          </div>
          {order.discount_amount > 0 && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Discount</dt>
              <dd className="numeric text-success">−{formatPrice(order.discount_amount)}</dd>
            </div>
          )}
          <div className="mt-1 flex justify-between border-t border-line pt-3">
            <dt className="display text-xl text-ink">Total paid</dt>
            <dd className="numeric text-lg font-semibold text-ink">{formatPrice(payment.amount)}</dd>
          </div>
        </dl>

        <footer className="mt-6 border-t border-line pt-4 text-center text-xs text-muted">
          Thank you for ordering from {settings.shopInfo.name}.
        </footer>
      </article>
    </main>
  );
}

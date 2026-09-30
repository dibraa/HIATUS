import type { Metadata } from "next";
import { getServerToken } from "@/lib/server-token";
import { apiJson } from "@/lib/api-client";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatDateTime, formatElapsed } from "@/lib/format";
import type { Shift } from "@/types/database";
import { ClockInForm, ClockOutForm } from "./shift-controls";

export const metadata: Metadata = { title: "My shift" };
export const dynamic = "force-dynamic";

export default async function ShiftPage() {
  const token = await getServerToken();

  const openShift = await apiJson<(Shift & { _id: string }) | null>("/staff/shift", { token: token ?? undefined }).catch(() => null);
  const shiftFailed = openShift === null;
  const shift = openShift ? { ...openShift, id: openShift._id ?? openShift.id } : null;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader size="utility" title="My shift" description="Clock in when you start, count the drawer when you finish." />

      {shift ? (
        <div className="flex flex-col gap-6">
          <section aria-labelledby="current-shift" className="rounded-lg border border-line bg-card p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <h2 id="current-shift" className="display text-lg text-ink">On shift</h2>
              <Badge tone="success">{formatElapsed(shift.started_at)} so far</Badge>
            </div>
            <p className="mt-2 text-sm text-muted">
              Started <time dateTime={shift.started_at}>{formatDateTime(shift.started_at)}</time>
            </p>

            <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4 text-sm">
              <div>
                <dt className="text-xs text-muted">Opening float</dt>
                <dd className="mt-0.5 font-semibold numeric text-ink">{formatPrice(shift.opening_cash)}</dd>
              </div>
            </dl>
          </section>

          <ClockOutForm expectedCash={shift.opening_cash} />
        </div>
      ) : (
        <ClockInForm />
      )}

      <section aria-labelledby="past-shifts" className="mt-10">
        <h2 id="past-shifts" className="mb-3 eyebrow text-muted">Recent shifts</h2>
        <EmptyState as="h3" title="No finished shifts yet" body="Once you clock out, your last few shifts are listed here." />
      </section>
    </div>
  );
}

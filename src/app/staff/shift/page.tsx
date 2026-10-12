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

  const [openShift, recentShifts] = await Promise.all([
    apiJson<(Shift & { _id: string }) | null>("/staff/shift", { token: token ?? undefined }).catch(() => null),
    apiJson<(Shift & { _id: string })[]>("/staff/shifts/history", { token: token ?? undefined }).catch(() => []),
  ]);
  const shift = openShift ? { ...openShift, id: openShift._id ?? openShift.id } : null;
  const history = recentShifts.map((item) => ({ ...item, id: item._id ?? item.id }));

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
        {history.length === 0 ? (
          <EmptyState as="h3" title="No finished shifts yet" body="Once you clock out, your last few shifts are listed here." />
        ) : (
          <ul className="flex flex-col gap-3">
            {history.map((past) => (
              <li key={past.id} className="rounded-lg border border-line bg-card p-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-medium text-ink">
                    <time dateTime={past.started_at}>{formatDateTime(past.started_at)}</time>
                  </p>
                  <span className="text-xs text-muted">
                    Ended <time dateTime={past.ended_at ?? undefined}>{past.ended_at ? formatDateTime(past.ended_at) : "—"}</time>
                  </span>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-3 border-t border-line pt-3 text-sm sm:grid-cols-3">
                  <div>
                    <dt className="text-xs text-muted">Opening float</dt>
                    <dd className="mt-0.5 numeric text-ink">{formatPrice(past.opening_cash)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Closing cash</dt>
                    <dd className="mt-0.5 numeric text-ink">{past.closing_cash === null ? "Not counted" : formatPrice(past.closing_cash)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Note</dt>
                    <dd className="mt-0.5 truncate text-ink">{past.note || "—"}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

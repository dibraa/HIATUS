import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { CheckerBand } from "@/components/ui/checker";
import { formatPrice, formatDateTime, formatElapsed } from "@/lib/format";
import { PAYMENT_METHOD_LABELS } from "@/lib/order-meta";
import type { Shift, ShiftReportRow, StaffActivity } from "@/types/database";
import { ClockInForm, ClockOutForm } from "./shift-controls";

export const metadata: Metadata = { title: "My shift" };

export const dynamic = "force-dynamic";

export default async function ShiftPage() {
  const supabase = await createClient();
  const user = await getCurrentUser();

  // RLS on `shifts` already restricts these to the caller's own rows, so
  // neither query needs a user filter to be safe — the filter is here so the
  // "open shift" lookup is a single row rather than a scan the client trims.
  const [{ data: openShift }, { data: recent }] = await Promise.all([
    supabase
      .from("shifts")
      .select("*")
      .eq("staff_id", user!.id)
      .is("ended_at", null)
      .maybeSingle<Shift>(),
    supabase
      .from("shifts")
      .select("*")
      .eq("staff_id", user!.id)
      .not("ended_at", "is", null)
      .order("started_at", { ascending: false })
      .limit(5)
      .returns<Shift[]>(),
  ]);

  // Only fetched for an open shift — the report of a finished one is history,
  // and the list below already carries what it needs.
  const { data: reportRows } = openShift
    ? await supabase.rpc("shift_report", { target_shift_id: openShift.id })
    : { data: null };

  const report = (reportRows as ShiftReportRow[] | null) ?? [];
  const cashTaken = report.find((r) => r.method === "cash")?.net_total ?? 0;
  const expectedCash = (openShift?.opening_cash ?? 0) + cashTaken;

  const { data: activity } = openShift
    ? await supabase
        .from("staff_activity")
        .select("*")
        .eq("staff_id", user!.id)
        .gte("created_at", openShift.started_at)
        .order("created_at", { ascending: false })
        .limit(12)
        .returns<StaffActivity[]>()
    : { data: null };

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="My shift"
        description="Clock in when you start, count the drawer when you finish."
      />

      {openShift ? (
        <div className="flex flex-col gap-6">
          {/* ---------- Live shift ---------- */}
          <section
            aria-labelledby="current-shift"
            className="overflow-hidden rounded-lg border border-line bg-card"
          >
            <CheckerBand size="sm" className="h-1.5" />

            <div className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                <div>
                  <h2 id="current-shift" className="text-lg font-semibold text-ink">
                    On shift
                  </h2>
                  <p className="mt-1 text-sm text-muted">
                    Started{" "}
                    <time dateTime={openShift.started_at}>
                      {formatDateTime(openShift.started_at)}
                    </time>
                  </p>
                </div>

                <Badge tone="success">
                  {formatElapsed(openShift.started_at)} so far
                </Badge>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4 text-sm">
                <div>
                  <dt className="text-xs text-muted">Opening float</dt>
                  <dd className="mt-0.5 font-semibold tabular-nums text-ink">
                    {formatPrice(openShift.opening_cash)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Cash taken</dt>
                  <dd className="mt-0.5 font-semibold tabular-nums text-ink">
                    {formatPrice(cashTaken)}
                  </dd>
                </div>
              </dl>

              {report.length > 0 && (
                <table className="mt-4 w-full border-t border-line pt-4 text-sm">
                  <caption className="sr-only">
                    Takings this shift, by payment method
                  </caption>
                  <thead>
                    <tr className="text-left text-2xs uppercase tracking-[0.14em] text-muted">
                      <th scope="col" className="py-2 font-semibold">Tender</th>
                      <th scope="col" className="py-2 text-right font-semibold">Taken</th>
                      <th scope="col" className="py-2 text-right font-semibold">Refunded</th>
                      <th scope="col" className="py-2 text-right font-semibold">Net</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {report.map((row) => (
                      <tr key={row.method}>
                        <th scope="row" className="py-2 text-left font-medium text-ink-soft">
                          {PAYMENT_METHOD_LABELS[row.method]}
                          <span className="ml-1.5 text-xs font-normal text-muted">
                            &times;{row.payments_count}
                          </span>
                        </th>
                        <td className="py-2 text-right tabular-nums text-ink-soft">
                          {formatPrice(row.payments_total)}
                        </td>
                        <td className="py-2 text-right tabular-nums text-muted">
                          {row.refunds_total > 0 ? `−${formatPrice(row.refunds_total)}` : "—"}
                        </td>
                        <td className="py-2 text-right font-semibold tabular-nums text-ink">
                          {formatPrice(row.net_total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          <ClockOutForm expectedCash={expectedCash} />

          {/* ---------- What you did ---------- */}
          {activity && activity.length > 0 && (
            <section aria-labelledby="shift-activity">
              <h2
                id="shift-activity"
                className="mb-3 text-2xs font-semibold uppercase tracking-[0.16em] text-muted"
              >
                This shift
              </h2>
              <ul className="divide-y divide-line rounded-lg border border-line bg-card">
                {activity.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex items-baseline justify-between gap-4 px-4 py-2.5 text-sm"
                  >
                    <span className="min-w-0 text-ink-soft">
                      {entry.detail ?? entry.action.replace(/_/g, " ")}
                    </span>
                    <time
                      dateTime={entry.created_at}
                      className="shrink-0 text-xs tabular-nums text-muted"
                    >
                      {formatElapsed(entry.created_at)} ago
                    </time>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      ) : (
        <ClockInForm />
      )}

      {/* ---------- History ---------- */}
      <section aria-labelledby="past-shifts" className="mt-10">
        <h2
          id="past-shifts"
          className="mb-3 text-2xs font-semibold uppercase tracking-[0.16em] text-muted"
        >
          Recent shifts
        </h2>

        {!recent || recent.length === 0 ? (
          <EmptyState
            as="h3"
            title="No finished shifts yet"
            body="Once you clock out, your last few shifts are listed here with what was in the drawer."
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {recent.map((shift) => {
              const variance =
                shift.closing_cash === null ? null : shift.closing_cash - shift.opening_cash;

              return (
                <li
                  key={shift.id}
                  className="rounded-lg border border-line bg-card px-4 py-3"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <p className="text-sm font-medium text-ink">
                      <time dateTime={shift.started_at}>
                        {formatDateTime(shift.started_at)}
                      </time>
                    </p>
                    <p className="text-xs text-muted">
                      {shift.ended_at && formatElapsed(shift.started_at, new Date(shift.ended_at))}
                    </p>
                  </div>

                  <p className="mt-1 text-xs tabular-nums text-muted">
                    Float {formatPrice(shift.opening_cash)}
                    {shift.closing_cash !== null && (
                      <>
                        {" · "}Counted {formatPrice(shift.closing_cash)}
                        {variance !== null && Math.abs(variance) >= 0.005 && (
                          <span className={variance < 0 ? "text-danger" : "text-warning"}>
                            {" "}
                            ({variance < 0 ? "−" : "+"}
                            {formatPrice(Math.abs(variance))})
                          </span>
                        )}
                      </>
                    )}
                  </p>

                  {shift.note && (
                    <p className="mt-1.5 text-xs text-ink-soft">&ldquo;{shift.note}&rdquo;</p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

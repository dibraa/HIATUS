import type { Metadata } from "next";
import { getServerToken } from "@/lib/server-token";
import { apiJson } from "@/lib/api-client";
import { EmptyState } from "@/components/ui/empty-state";
import { DataError } from "@/components/ui/data-error";
import { formatPrice, formatDateTime, formatElapsed } from "@/lib/format";
import type { Shift } from "@/types/database";
import { ClockInForm, ClockOutForm } from "./shift-controls";
import { StaffPageHeading } from "../staff-page-heading";

export const metadata: Metadata = { title: "My shift" };
export const dynamic = "force-dynamic";

export default async function ShiftPage() {
  const token = await getServerToken();

  const [openShift, recentShifts] = await Promise.all([
    apiJson<(Shift & { _id: string }) | null>("/staff/shift", {
      token: token ?? undefined,
    }),
    apiJson<(Shift & { _id: string })[]>("/staff/shifts/history", {
      token: token ?? undefined,
    }),
  ]).catch(() => [undefined, undefined] as const);
  if (openShift === undefined || recentShifts === undefined)
    return (
      <div>
        <StaffPageHeading title="My shift" />
        <div className="pt-4">
          <DataError
            title="Couldn't load your shift"
            body="Check your connection. Your clock-in status couldn't be verified."
            showRetry
          />
        </div>
      </div>
    );
  const shift = openShift
    ? { ...openShift, id: openShift._id ?? openShift.id }
    : null;
  const history = recentShifts.map((item) => ({
    ...item,
    id: item._id ?? item.id,
  }));

  return (
    <div>
      <StaffPageHeading title="My shift" />
      <div className="grid gap-5 pt-4">
        <p className="staff-lead">
          Clock in when you start, count the drawer when you finish.
        </p>

        {/* The job (clock in, or the open shift and clocking out) leads on
            the left; the record of past shifts sits beside it on wide
            screens and below it on narrow ones. */}
        <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-8">
          {shift ? (
            <div className="flex flex-col gap-6">
              <section
                aria-labelledby="current-shift"
                className="staff-panel p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                  <h2 id="current-shift" className="display staff-section-title">
                    On shift
                  </h2>
                  <span className="counter-tag is-success">
                    {formatElapsed(shift.started_at)} so far
                  </span>
                </div>
                <p className="staff-lead mt-2">
                  Started{" "}
                  <time dateTime={shift.started_at}>
                    {formatDateTime(shift.started_at)}
                  </time>
                </p>

                <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4 text-sm">
                  <div>
                    <dt className="staff-caption">Opening float</dt>
                    <dd className="mt-0.5 font-semibold numeric text-ink">
                      {formatPrice(shift.opening_cash)}
                    </dd>
                  </div>
                </dl>
              </section>

              <ClockOutForm expectedCash={shift.opening_cash} />
        </div>
      ) : (
        <ClockInForm />
      )}

      <section aria-labelledby="past-shifts">
        <h2 id="past-shifts" className="display staff-section-title mb-3">
          Recent shifts
        </h2>
        {history.length === 0 ? (
          <EmptyState
            as="h3"
            title="No finished shifts yet"
            body="Once you clock out, your last few shifts are listed here."
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {history.map((past) => (
              <li
                key={past.id}
                className="staff-panel p-4"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-medium text-ink">
                    <time dateTime={past.started_at}>
                      {formatDateTime(past.started_at)}
                    </time>
                  </p>
                  <span className="staff-caption">
                    Ended{" "}
                    <time dateTime={past.ended_at ?? undefined}>
                      {past.ended_at ? formatDateTime(past.ended_at) : "—"}
                    </time>
                  </span>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-3 border-t border-line pt-3 text-sm sm:grid-cols-3">
                  <div>
                    <dt className="staff-caption">Opening float</dt>
                    <dd className="mt-0.5 numeric text-ink">
                      {formatPrice(past.opening_cash)}
                    </dd>
                  </div>
                  <div>
                    <dt className="staff-caption">Closing cash</dt>
                    <dd className="mt-0.5 numeric text-ink">
                      {past.closing_cash === null
                        ? "Not counted"
                        : formatPrice(past.closing_cash)}
                    </dd>
                  </div>
                  <div>
                    <dt className="staff-caption">Note</dt>
                    <dd className="mt-0.5 truncate text-ink">
                      {past.note || "—"}
                    </dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
        )}
      </section>
        </div>
      </div>
    </div>
  );
}

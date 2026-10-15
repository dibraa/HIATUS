import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentUser, accessOf } from "@/lib/auth";
import { isAdmin, isStaff } from "@/lib/roles";
import { apiJson } from "@/lib/api-client";
import { getServerToken } from "@/lib/server-token";
import { formatPrice } from "@/lib/format";
import { StaffNav } from "@/components/staff-nav";
import { ThemeProvider } from "@/components/theme-provider";
import type { Shift, TodaySummary } from "@/types/database";

/**
 * The counter's frame: one bar with the sections, the count of new orders,
 * and the shift — clocked in since when, and the drawer float — so the two
 * side jobs (sold out, shift) are one tap from the queue and never a reason
 * to lose sight of it.
 *
 * The queue is a wide table and gets the full width; the other staff pages
 * keep the narrower reading column they were designed for.
 */
export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const access = accessOf(user);

  if (!user) redirect("/login?next=/staff");
  if (isAdmin(access)) redirect("/admin");
  if (!isStaff(access)) redirect("/");

  const token = (await getServerToken()) ?? undefined;
  const [shift, summary] = await Promise.all([
    apiJson<Shift | null>("/staff/shift", { token }).catch(() => null),
    apiJson<TodaySummary>("/analytics/today", { token }).catch(() => null),
  ]);
  const pathname = (await headers()).get("x-pathname") ?? "";
  const wide = pathname === "/staff";

  const since = shift
    ? new Intl.DateTimeFormat("en-PH", { timeZone: "Asia/Manila", hour: "numeric", minute: "2-digit" }).format(
        new Date(shift.started_at)
      )
    : null;

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-surface">
        <header className="sticky top-0 z-30 border-b border-line bg-surface">
          <div className="flex items-center gap-3 px-3 py-2 sm:px-4">
            <span className="display hidden text-xl text-ink sm:inline">Counter</span>
            <StaffNav newCount={summary?.pending_now ?? 0} />
            <Link
              href="/staff/shift"
              className="ui-caps ml-auto hidden min-h-12 shrink-0 items-center gap-2 rounded-xl px-3 text-2xs text-ink-soft hover:bg-raised md:inline-flex"
            >
              <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${shift ? "bg-success" : "bg-warning"}`} />
              {shift ? (
                <>
                  On shift <span className="text-ink">since {since}</span> · drawer{" "}
                  <span className="numeric text-ink">{formatPrice(shift.opening_cash)}</span>
                </>
              ) : (
                <>Not clocked in · clock in</>
              )}
            </Link>
          </div>
        </header>

        <div className={wide ? "px-3 py-4 sm:px-4" : "mx-auto max-w-5xl px-4 py-6 sm:px-6"}>{children}</div>
      </div>
    </ThemeProvider>
  );
}

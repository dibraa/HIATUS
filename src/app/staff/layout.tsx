import { redirect } from "next/navigation";
import { getCurrentUser, accessOf } from "@/lib/auth";
import { isAdmin, isStaff } from "@/lib/roles";
import { apiJson } from "@/lib/api-client";
import { getServerToken } from "@/lib/server-token";
import { formatPrice } from "@/lib/format";
import { StaffNav } from "@/components/staff-nav";
import { StaffSidebar } from "@/components/staff-sidebar";
import { StaffTopbar } from "@/components/staff-topbar";
import { ThemeProvider } from "@/components/theme-provider";
import { USE_MOCKS, MOCK_QUEUE, MOCK_SHIFT, MOCK_USER } from "@/lib/mock-staff-data";
import type { Shift, TodaySummary } from "@/types/database";

/**
 * The counter's frame: a fixed rail (brand, who is on shift, the sections,
 * sign out) with the workspace beside it. On phones the rail collapses to a
 * top bar so the queue keeps the full width.
 *
 * Frontend-first: with USE_MOCKS the shell renders from mock data and skips
 * the auth redirects, so the queue is viewable with no backend running.
 */
export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  let staffName = MOCK_USER.name;
  let newCount = MOCK_QUEUE.filter((o) => o.status === "pending").length;
  let onShift = true;
  let since: string | null = MOCK_SHIFT.since;
  let drawerCash: string | null = formatPrice(MOCK_SHIFT.openingCash);
  const mockUnpaid = MOCK_QUEUE.filter((o) => o.payment_status === "unpaid");
  let alerts = {
    fresh: newCount,
    unpaidCount: mockUnpaid.length,
    unpaidTotal: formatPrice(mockUnpaid.reduce((s, o) => s + o.total_amount, 0)).replace(".00", ""),
  };

  if (!USE_MOCKS) {
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
    staffName = user.profile?.full_name?.trim() || user.email.split("@")[0];
    newCount = summary?.pending_now ?? 0;
    onShift = !!shift;
    since = shift
      ? new Intl.DateTimeFormat("en-PH", { timeZone: "Asia/Manila", hour: "numeric", minute: "2-digit" }).format(
          new Date(shift.started_at)
        )
      : null;
    drawerCash = shift ? formatPrice(shift.opening_cash) : null;
    alerts = { fresh: newCount, unpaidCount: summary?.unpaid_now ?? 0, unpaidTotal: "" };
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-surface">
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-[15.5rem] border-r border-line bg-card lg:block">
          <StaffSidebar staffName={staffName} newCount={newCount} onShift={onShift} since={since} drawerCash={drawerCash} />
        </aside>

        <div className="min-w-0 lg:pl-[15.5rem]">
          <header className="sticky top-0 z-30">
            <StaffTopbar
              staffName={staffName}
              onShift={onShift}
              since={since}
              alerts={alerts}
            />
            <div className="border-b border-line bg-surface px-3 py-1.5 lg:hidden">
              <StaffNav newCount={newCount} />
            </div>
          </header>

          <div className="px-3 py-4 sm:px-4 lg:px-6 lg:py-6">{children}</div>
        </div>
      </div>
    </ThemeProvider>
  );
}

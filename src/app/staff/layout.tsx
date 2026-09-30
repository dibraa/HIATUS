import { redirect } from "next/navigation";
import { getCurrentUser, accessOf } from "@/lib/auth";
import { isAdmin, isStaff } from "@/lib/roles";
import { StaffNav } from "@/components/staff-nav";
import { ThemeProvider } from "@/components/theme-provider";

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const access = accessOf(user);

  if (!user) redirect("/login?next=/staff");

  // Belt and braces: src/proxy.ts gates /staff/* at the request boundary and
  // this layout keeps admins in the admin workspace even if they reach this
  // route through a stale page or client-side navigation.
  if (isAdmin(access)) redirect("/admin");
  if (!isStaff(access)) redirect("/");

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-surface">
        {/* Top bar — full-width header, one row */}
        <header className="border-b border-line bg-surface">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <span className="display text-lg tracking-[-0.02em] text-ink">Counter</span>
            <StaffNav />
            <div className="flex items-center gap-2">
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
          {children}
        </div>
      </div>
    </ThemeProvider>
  );
}

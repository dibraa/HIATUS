import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, accessOf } from "@/lib/auth";
import { isAdmin, isStaff } from "@/lib/roles";
import { StaffNav } from "@/components/staff-nav";

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const access = accessOf(user);

  if (!user) redirect("/login?next=/staff");

  // Belt and braces: src/proxy.ts gates /staff/* at the request boundary and
  // the SQL functions gate every write. This is the third check, and the
  // cheapest to keep. isStaff() is true for admins too, deliberately — an
  // owner working the counter is the normal case, not an exception.
  if (!isStaff(access)) redirect("/");

  return (
    <div className="min-h-screen bg-surface">
      {/* Top bar */}
      <div className="border-b border-line bg-card">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <span className="display text-lg tracking-[-0.02em] text-ink">Counter</span>
          {isAdmin(access) && (
            <Link
              href="/admin"
              className="text-sm text-muted transition-colors hover:text-ink"
            >
              Admin dashboard
            </Link>
          )}
        </div>
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <StaffNav />
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {children}
      </div>
    </div>
  );
}

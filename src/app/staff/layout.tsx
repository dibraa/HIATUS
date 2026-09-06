import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, accessOf } from "@/lib/auth";
import { isAdmin, isStaff } from "@/lib/roles";
import { StaffNav } from "@/components/staff-nav";
import { CheckerBand } from "@/components/ui/checker";

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
    <div className="rounded-2xl border border-line bg-card p-4 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="text-2xs font-semibold uppercase tracking-[0.16em] text-accent-ink">
          Counter
        </p>

        {/* An owner working the queue needs one tap back to the books, and a
            plain barista should not see a link to a page they cannot open. */}
        {isAdmin(access) && (
          <Link
            href="/admin"
            className="text-sm font-medium text-muted underline underline-offset-4 transition-colors duration-150 ease-hi hover:text-ink"
          >
            Admin dashboard
          </Link>
        )}
      </div>

      <CheckerBand size="sm" className="mt-3 h-1.5" />

      <div className="mt-4">
        <StaffNav />
      </div>

      <div className="mt-7">{children}</div>
    </div>
  );
}

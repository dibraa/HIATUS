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
    <div className="rounded-2xl border border-line bg-card p-4 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="eyebrow text-accent-ink">
          Counter
        </p>

        {/* An owner working the queue needs one tap back to the books, and a
            plain barista should not see a link to a page they cannot open. */}
        {isAdmin(access) && (
          <Link
            href="/admin"
            className="ui-caps text-2xs text-muted underline underline-offset-4 transition-colors hover:text-ink"
          >
            Admin dashboard
          </Link>
        )}
      </div>

      <div className="mt-5">
        <StaffNav />
      </div>

      <div className="mt-7">{children}</div>
    </div>
  );
}

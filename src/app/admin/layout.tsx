import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, accessOf } from "@/lib/auth";
import { isAdmin } from "@/lib/roles";
import { AdminNav } from "@/components/admin-nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const access = accessOf(user);

  if (!user) redirect("/login?next=/admin");

  // Belt and braces: src/proxy.ts gates /admin/* at the request boundary and
  // RLS gates the data. This is the third check, and the cheapest to keep.
  if (!isAdmin(access)) redirect("/");

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="eyebrow text-accent-ink">
          Admin
        </p>

        {/* An owner who is actually working the counter needs one tap to the
            queue, and back again from the staff layout. */}
        <Link
          href="/staff"
          className="ui-caps text-2xs text-muted underline underline-offset-4 transition-colors hover:text-ink"
        >
          Order queue
        </Link>
      </div>

      <div className="mt-5">
        <AdminNav />
      </div>

      <div className="mt-6">{children}</div>
    </div>
  );
}

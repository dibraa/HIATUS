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
    <div className="admin-workspace min-h-screen bg-surface px-3 py-3 sm:px-5 sm:py-5 lg:px-6">
      <div className="mx-auto grid max-w-[1440px] gap-5 lg:grid-cols-[190px_minmax(0,1fr)]">
        <aside className="rounded-[1.5rem] bg-raised px-3 py-5 shadow-sm lg:min-h-[calc(100vh-7rem)]">
          <div className="flex items-center gap-3 px-3 pb-8">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-inverse-bg text-sm font-bold text-inverse-fg">
              H
            </span>
            <span className="text-sm font-semibold tracking-[0.18em] text-ink">
              HIATUS
            </span>
          </div>
          <AdminNav />
          <div className="mt-8 border-t border-line pt-5">
            <Link
              href="/staff"
              className="flex min-h-11 items-center rounded-xl px-3 text-sm font-medium text-ink-soft transition-colors hover:bg-card hover:text-ink"
            >
              Order queue
            </Link>
          </div>
        </aside>

        <section className="min-w-0 rounded-[1.5rem] bg-card px-4 py-5 shadow-lg sm:px-6 lg:px-8 lg:py-7">
          <div className="mb-7 flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
            <div>
              <p className="text-xs font-medium text-muted">Admin workspace</p>
              <p className="mt-1 text-xl font-semibold tracking-tight text-ink">
                Welcome back
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent-ink">
              {user.email?.slice(0, 1).toUpperCase() || "A"}
            </div>
          </div>
          {children}
        </section>
      </div>
    </div>
  );
}

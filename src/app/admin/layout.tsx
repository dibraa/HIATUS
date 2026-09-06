import { redirect } from "next/navigation";
import Image from "next/image";
import { getCurrentUser, accessOf } from "@/lib/auth";
import { isAdmin } from "@/lib/roles";
import { AdminNav } from "@/components/admin-nav";
import { AdminBackButton } from "@/components/admin-back-button";
import { SignOutButton } from "@/components/sign-out-button";

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
        <aside className="rounded-[1.5rem] border border-line bg-raised px-3 py-5 shadow-md lg:min-h-[calc(100vh-7rem)]">
          <div className="flex items-center gap-3 px-3 pb-8">
            <Image
              src="/logo.png"
              alt="Hiatus"
              width={48}
              height={48}
              className="h-10 w-10 rounded-xl bg-white object-contain"
            />
            <span className="text-sm font-semibold tracking-[0.18em] text-ink">
              HIATUS
            </span>
          </div>
          <AdminNav />
          <div className="mt-8 border-t border-line pt-5">
            <SignOutButton />
          </div>
        </aside>

        <section className="min-w-0 rounded-[1.5rem] border border-line bg-card px-4 py-5 shadow-lg sm:px-6 lg:px-8 lg:py-8">
          <AdminBackButton />
          {children}
        </section>
      </div>
    </div>
  );
}

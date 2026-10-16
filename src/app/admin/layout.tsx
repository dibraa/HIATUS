import { redirect } from "next/navigation";
import { getCurrentUser, accessOf } from "@/lib/auth";
import { isAdmin } from "@/lib/roles";
import { AdminSidebar } from "@/components/admin-sidebar";
import { AdminBackButton } from "@/components/admin-back-button";
import "./admin.css";

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
    <div className="admin-workspace">
      <a href="#admin-content" className="admin-skip-link">Skip to admin content</a>
      <AdminSidebar account={{ full_name: user.profile?.full_name, email: user.email }} />
      <div className="admin-main">
        <section id="admin-content" tabIndex={-1} className="admin-content" aria-label="Admin workspace">
          <AdminBackButton />
          {children}
        </section>
      </div>
    </div>
  );
}

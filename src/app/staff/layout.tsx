import { redirect } from "next/navigation";
import { getCurrentUser, accessOf } from "@/lib/auth";
import { isAdmin, isStaff } from "@/lib/roles";
import { StaffSidebar } from "@/components/staff-sidebar";
import { StaffNav } from "@/components/staff-nav";
import { ThemeProvider } from "@/components/theme-provider";
import { SignOutButton } from "@/components/sign-out-button";
import { USE_MOCKS, MOCK_USER } from "@/lib/mock-staff-data";
import "./staff.css";

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let staffName = MOCK_USER.name;
  let staffEmail = MOCK_USER.email;
  if (!USE_MOCKS) {
    const user = await getCurrentUser();
    const access = accessOf(user);
    if (!user) redirect("/login?next=/staff");
    if (isAdmin(access)) redirect("/admin");
    if (!isStaff(access)) redirect("/");
    staffName = user.profile?.full_name?.trim() || user.email.split("@")[0];
    staffEmail = user.email;
  }
  return (
    <ThemeProvider>
      <div className="staff-workspace">
        <aside className="counter-sidebar">
          <StaffSidebar staffName={staffName} staffEmail={staffEmail} />
        </aside>
        <div className="counter-content">
          <header className="counter-masthead">
            <p className="ui-caps">Hiatus Coffee / Staff</p>
            <p>A good shift starts here.</p>
            <div className="counter-mobile-signout"><SignOutButton /></div>
          </header>
          <div className="counter-mobile-nav">
            <StaffNav />
          </div>
          {children}
        </div>
      </div>
    </ThemeProvider>
  );
}

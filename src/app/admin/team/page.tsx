import type { Metadata } from "next";
import { getServerToken } from "@/lib/server-token";
import { apiJson } from "@/lib/api-client";
import { getCurrentUser } from "@/lib/auth";
import { AdminPageHeader as PageHeader } from "@/components/admin-page-header";
import type { Role } from "@/types/database";
import { TeamTable } from "./team-table";

export const metadata: Metadata = { title: "Team" };
export const dynamic = "force-dynamic";

type TeamMember = {
  _id: string;
  id?: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: Role;
  is_active: boolean;
  created_at: string;
  on_shift: boolean;
};
type ActiveShift = { staff_id: { _id: string } | string };

export default async function TeamPage() {
  const token = await getServerToken();
  const me = await getCurrentUser();

  const [teamResult, shiftResult] = await Promise.allSettled([
    apiJson<TeamMember[]>("/admin/team", { token: token ?? undefined }),
    apiJson<ActiveShift[]>("/staff/shifts", { token: token ?? undefined }),
  ]);
  const raw = teamResult.status === "fulfilled" ? teamResult.value : [];
  const activeShifts =
    shiftResult.status === "fulfilled" ? shiftResult.value : [];
  const loadError =
    teamResult.status === "rejected"
      ? teamResult.reason instanceof Error
        ? teamResult.reason.message
        : "The roster could not be loaded."
      : null;
  const activeStaffIds = new Set(
    activeShifts.map((shift) =>
      typeof shift.staff_id === "string" ? shift.staff_id : shift.staff_id._id,
    ),
  );
  const members = raw.map((m) => ({
    ...m,
    id: m._id ?? m.id,
    on_shift: activeStaffIds.has(m._id),
  }));

  return (
    <div>
      <PageHeader
        title="Team"
        description="Who can work the counter, who can see the books."
      />

      <section className="admin-panel" aria-label="Team accounts">
        <TeamTable
          members={members}
          currentUserId={me?.id}
          loadError={loadError}
        />
      </section>
    </div>
  );
}

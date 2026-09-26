import type { Metadata } from "next";
import { getServerToken } from "@/lib/supabase/server";
import { apiJson } from "@/lib/api-client";
import { getCurrentUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import { ROLE_DESCRIPTIONS, ROLE_LABELS } from "@/lib/roles";
import type { Role } from "@/types/database";
import { GrantRoleForm, MemberControls } from "./team-controls";

export const metadata: Metadata = { title: "Team" };
export const dynamic = "force-dynamic";

type TeamMember = { _id: string; id?: string; email: string; full_name: string | null; phone: string | null; role: Role; is_active: boolean; created_at: string };

const ROLE_TONE: Record<Role, "accent" | "green" | "neutral"> = { admin: "accent", staff: "green", customer: "neutral" };

export default async function TeamPage() {
  const token = await getServerToken();
  const me = await getCurrentUser();

  const raw = await apiJson<TeamMember[]>("/admin/team", { token: token ?? undefined }).catch(() => []);
  const members = raw.map((m) => ({ ...m, id: m._id ?? m.id, on_shift: false }));

  return (
    <div>
      <PageHeader title="Team" description="Who can work the counter, who can see the books." />

      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.78fr)]">
        <section aria-labelledby="roster-heading">
          <h2 id="roster-heading" className="mb-3 eyebrow text-muted">Roster</h2>

          {members.length === 0 ? (
            <EmptyState as="h3" title="No staff yet" body="Grant a role to someone who has already signed up." />
          ) : (
            <ul className="flex flex-col gap-3">
              {members.map((member) => {
                const isMe = member.id === me?.id;
                return (
                  <li key={member.id} className={`rounded-lg border bg-card p-4 ${member.is_active ? "border-line" : "border-danger/30"}`}>
                    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-ink">{member.full_name?.trim() || "Unnamed"}</span>
                          {isMe && <Badge tone="neutral">You</Badge>}
                        </p>
                        <p className="mt-0.5 truncate text-sm text-muted">{member.email}</p>
                        {member.phone && <p className="text-xs text-muted">{member.phone}</p>}
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                        <Badge tone={ROLE_TONE[member.role]}>{ROLE_LABELS[member.role]}</Badge>
                        {!member.is_active && <Badge tone="danger">Suspended</Badge>}
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-muted">Joined {formatDate(member.created_at)}</p>
                    <div className="mt-3 border-t border-line pt-3">
                      {isMe ? (
                        <p className="text-xs text-muted">You cannot change your own role or suspend yourself.</p>
                      ) : (
                        <MemberControls member={{ ...member, on_shift: false }} />
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <dl className="mt-6 rounded-lg border border-line bg-raised p-4 text-sm">
            <p className="mb-2 eyebrow text-muted">What each role can do</p>
            {(["staff", "admin"] as Role[]).map((role) => (
              <div key={role} className="mt-2 first:mt-0">
                <dt className="inline font-semibold text-ink">{ROLE_LABELS[role]}: </dt>
                <dd className="inline text-ink-soft">{ROLE_DESCRIPTIONS[role]}</dd>
              </div>
            ))}
          </dl>
        </section>

        <div className="flex flex-col gap-8 lg:pt-8">
          <GrantRoleForm />
        </div>
      </div>
    </div>
  );
}

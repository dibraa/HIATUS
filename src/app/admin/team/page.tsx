import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { FormError } from "@/components/ui/field";
import { formatDate, formatElapsed } from "@/lib/format";
import { ROLE_DESCRIPTIONS, ROLE_LABELS } from "@/lib/roles";
import type { Role, StaffActivity, TeamMember } from "@/types/database";
import { GrantRoleForm, MemberControls } from "./team-controls";

export const metadata: Metadata = { title: "Team" };

export const dynamic = "force-dynamic";

type ActivityRow = StaffActivity & {
  profiles: { full_name: string | null } | null;
};

/** Human wording for the action slugs the RPCs write into the audit log. */
const ACTION_LABELS: Record<string, string> = {
  order_status: "Order status",
  menu_availability: "Availability",
  payment: "Payment",
  refund: "Refund",
  void: "Void",
  manual_discount: "Manual discount",
  table_assign: "Table",
  shift_start: "Clocked in",
  shift_end: "Clocked out",
  role_change: "Role change",
  account_active: "Account access",
  setting_change: "Settings",
};

const ROLE_TONE: Record<Role, "accent" | "green" | "neutral"> = {
  admin: "accent",
  staff: "green",
  customer: "neutral",
};

export default async function TeamPage() {
  const supabase = await createClient();
  const me = await getCurrentUser();

  const [{ data: team, error }, { data: activity }] = await Promise.all([
    supabase.rpc("list_team"),
    supabase
      .from("staff_activity")
      .select("*, profiles(full_name)")
      .order("created_at", { ascending: false })
      .limit(40)
      .returns<ActivityRow[]>(),
  ]);

  const members = (team as TeamMember[] | null) ?? [];
  const log = activity ?? [];

  return (
    <div>
      <PageHeader
        title="Team"
        description="Who can work the counter, who can see the books, and what everyone has been doing."
      />

      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.78fr)]">
        {/* ---------- Roster ---------- */}
        <section aria-labelledby="roster-heading">
          <h2
            id="roster-heading"
            className="mb-3 text-2xs font-semibold uppercase tracking-[0.16em] text-muted"
          >
            Roster
          </h2>

          {error ? (
            <FormError>{error.message}</FormError>
          ) : members.length === 0 ? (
            <EmptyState
              as="h3"
              title="No staff yet"
              body="Grant a role to someone who has already signed up, using the form beside this list."
            />
          ) : (
            <ul className="flex flex-col gap-3">
              {members.map((member) => {
                const isMe = member.id === me?.id;

                return (
                  <li
                    key={member.id}
                    className={`rounded-lg border bg-card p-4 ${
                      member.is_active ? "border-line" : "border-danger/30"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-ink">
                            {member.full_name?.trim() || "Unnamed"}
                          </span>
                          {isMe && <Badge tone="neutral">You</Badge>}
                        </p>
                        <p className="mt-0.5 truncate text-sm text-muted">
                          {member.email}
                        </p>
                        {member.phone && (
                          <p className="text-xs text-muted">{member.phone}</p>
                        )}
                      </div>

                      <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                        <Badge tone={ROLE_TONE[member.role]}>
                          {ROLE_LABELS[member.role]}
                        </Badge>
                        {member.on_shift && <Badge tone="success">On shift</Badge>}
                        {!member.is_active && <Badge tone="danger">Suspended</Badge>}
                      </div>
                    </div>

                    <p className="mt-2 text-xs text-muted">
                      Joined {formatDate(member.created_at)}
                    </p>

                    <div className="mt-3 border-t border-line pt-3">
                      {isMe ? (
                        // The SQL refuses both of these on your own account,
                        // so the UI does not offer a button that would fail.
                        <p className="text-xs text-muted">
                          You cannot change your own role or suspend yourself.
                          Ask another admin.
                        </p>
                      ) : (
                        <MemberControls member={member} />
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <dl className="mt-6 rounded-lg border border-line bg-raised p-4 text-sm">
            <p className="mb-2 text-2xs font-semibold uppercase tracking-[0.16em] text-muted">
              What each role can do
            </p>
            {(["staff", "admin"] as Role[]).map((role) => (
              <div key={role} className="mt-2 first:mt-0">
                <dt className="inline font-semibold text-ink">{ROLE_LABELS[role]}: </dt>
                <dd className="inline text-ink-soft">{ROLE_DESCRIPTIONS[role]}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* ---------- Grant + audit ---------- */}
        <div className="flex flex-col gap-8 lg:pt-8">
          <GrantRoleForm />

          <section aria-labelledby="audit-heading">
            <h2
              id="audit-heading"
              className="mb-3 text-2xs font-semibold uppercase tracking-[0.16em] text-muted"
            >
              Activity log
            </h2>

            {log.length === 0 ? (
              <EmptyState
                as="h3"
                title="Nothing logged yet"
                body="Status changes, payments, refunds and settings edits are recorded here as they happen."
              />
            ) : (
              <ul className="max-h-[36rem] divide-y divide-line overflow-y-auto rounded-lg border border-line bg-card">
                {log.map((entry) => (
                  <li key={entry.id} className="px-4 py-2.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="min-w-0 text-sm text-ink">
                        <span className="font-medium">
                          {entry.profiles?.full_name?.trim() || "Someone"}
                        </span>{" "}
                        <span className="text-muted">
                          {ACTION_LABELS[entry.action] ??
                            entry.action.replace(/_/g, " ")}
                        </span>
                      </p>
                      <time
                        dateTime={entry.created_at}
                        className="shrink-0 text-xs tabular-nums text-muted"
                      >
                        {formatElapsed(entry.created_at)}
                      </time>
                    </div>
                    {entry.detail && (
                      <p className="mt-0.5 text-xs text-ink-soft">{entry.detail}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

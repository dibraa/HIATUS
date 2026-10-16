"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { TextField, SelectField } from "@/components/ui/field";
import { ROLE_LABELS } from "@/lib/roles";
import type { Role } from "@/types/database";
import { AddToTeamRow, MemberControls, CreateStaffForm, GrantRoleDialog } from "./team-controls";

type TableMember = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: Role;
  is_active: boolean;
  on_shift: boolean;
  created_at: string;
};

type RoleFilter = "all" | Role;
type StatusFilter = "all" | "on_shift" | "suspended" | "available";

const ROLE_FILTERS: { value: RoleFilter; label: string }[] = [
  { value: "all", label: "All roles" },
  { value: "staff", label: "Staff" },
  { value: "admin", label: "Admin" },
];

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "on_shift", label: "On shift" },
  { value: "suspended", label: "Suspended" },
  { value: "available", label: "Available" },
];

export function TeamTable({
  members,
  currentUserId,
  loadError,
}: {
  members: TableMember[];
  currentUserId?: string;
  loadError?: string | null;
}) {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<RoleFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return members.filter((member) => {
      if (role !== "all" && member.role !== role) return false;
      if (status === "on_shift" && !member.on_shift) return false;
      if (status === "suspended" && member.is_active) return false;
      if (status === "available" && (!member.is_active || member.on_shift)) return false;
      if (!needle) return true;
      const haystack = `${member.full_name ?? ""} ${member.email}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [members, query, role, status]);

  function clearFilters() {
    setQuery("");
    setRole("all");
    setStatus("all");
  }

  return (
    <div>
      <div className="admin-team-toolbar">
        <TextField
          id="team-search"
          label="Search team"
          type="search"
          autoComplete="off"
          placeholder="Name or email"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <SelectField id="team-role-filter" label="Role" value={role} onChange={(event) => setRole(event.target.value as RoleFilter)}>
          {ROLE_FILTERS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </SelectField>
        <SelectField id="team-status-filter" label="Status" value={status} onChange={(event) => setStatus(event.target.value as StatusFilter)}>
          {STATUS_FILTERS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </SelectField>
        <div className="admin-team-toolbar-actions">
          <GrantRoleDialog />
          <CreateStaffForm />
        </div>
      </div>

      {loadError ? (
        <div role="alert" className="rounded-lg border border-danger/40 bg-card px-4 py-8 text-center">
          <p className="text-sm font-medium text-ink">Could not load the roster.</p>
          <p className="mt-1 text-sm text-muted">{loadError}</p>
          <a href="/admin/team" className="mt-4 inline-flex min-h-11 items-center text-sm text-accent-ink underline underline-offset-4 hover:text-ink">Try again</a>
        </div>
      ) : (
        <>
          <p className="admin-team-count" role="status">{filtered.length === members.length ? members.length : filtered.length + " of " + members.length} member{members.length === 1 ? "" : "s"}</p>
          <div className="admin-table-scroll" tabIndex={0} role="region" aria-label="Team accounts table">
            <table className="admin-team-table w-full text-left text-sm">
              <caption className="sr-only">Team members, their role, account status and available actions.</caption>
              <thead className="border-b border-line text-xs text-muted">
                <tr>
                  <th scope="col" className="px-2 py-3 font-medium">Member</th>
                  <th scope="col" className="px-2 py-3 font-medium">Role</th>
                  <th scope="col" className="px-2 py-3 font-medium">Status</th>
                  <th scope="col" className="px-2 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {members.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-12 text-center">
                    <p className="text-sm text-ink">No accounts yet.</p>
                    <p className="mt-1 text-sm text-muted">Create the first staff account to get started.</p>
                  </td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-12 text-center">
                    <p className="text-sm text-ink">No matches.</p>
                    <p className="mt-1 text-sm text-muted">Try a different name, email, or filter.</p>
                    <button type="button" onClick={clearFilters} className="mt-3 inline-flex min-h-11 items-center text-sm text-accent-ink underline underline-offset-4 hover:text-ink">Clear search and filters</button>
                  </td></tr>
                ) : filtered.map((member) => {
                  const isMe = member.id === currentUserId;
                  return (
                    <tr key={member.id} className="text-ink-soft">
                      <th scope="row" className="admin-team-member px-2 py-4 font-medium text-ink">
                        <span className="flex flex-wrap items-center gap-2">
                          <span>{member.full_name?.trim() || "Unnamed"}</span>
                          {isMe && <Badge tone="neutral">You</Badge>}
                        </span>
                        <span className="mt-1 block text-xs font-normal text-muted">{member.email}</span>
                      </th>
                      <td className="px-2 py-4 text-xs">{ROLE_LABELS[member.role]}</td>
                      <td className="px-2 py-4">
                        {member.is_active ? (
                          <Badge tone={member.on_shift ? "success" : "neutral"}>{member.on_shift ? "Active" : "Away"}</Badge>
                        ) : <Badge tone="danger">Suspended</Badge>}
                      </td>
                      <td className="px-2 py-4 text-right">
                        {member.role === "customer" ? <AddToTeamRow member={member} /> : isMe ? <span className="text-xs text-muted">Current account</span> : <MemberControls member={member} />}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

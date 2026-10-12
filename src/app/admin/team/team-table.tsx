"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { TextField } from "@/components/ui/field";
import { ROLE_LABELS } from "@/lib/roles";
import type { Role } from "@/types/database";
import { AddToTeamRow, MemberControls } from "./team-controls";

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

function initials(name: string | null, email: string) {
  const source = name?.trim() || email;
  const words = source.split(/\s+/).filter(Boolean);
  return (words.length > 1 ? `${words[0][0]}${words[1][0]}` : source.slice(0, 2)).toUpperCase();
}

function relativeDate(value: string) {
  const days = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 86400000));
  if (days === 0) return "Today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

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

  if (loadError) {
    return (
      <div role="alert" className="rounded-lg border border-danger/40 bg-card px-4 py-8 text-center">
        <p className="text-sm font-medium text-ink">Could not load the roster.</p>
        <p className="mt-1 text-sm text-muted">{loadError}</p>
        <a href="/admin/team" className="mt-4 inline-block text-xs text-accent-ink underline underline-offset-2 hover:text-ink">
          Try again
        </a>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3 flex flex-col gap-3">
        <div className="max-w-sm">
          <TextField
            id="team-search"
            label="Search team"
            type="search"
            autoComplete="off"
            placeholder="Name or email"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter roster">
          {ROLE_FILTERS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={role === option.value}
              onClick={() => setRole(option.value)}
              className={`ui-caps rounded-md border px-2.5 py-1 text-2xs ${
                role === option.value
                  ? "border-transparent bg-cta text-cta-fg"
                  : "border-line-strong bg-card text-ink-soft hover:text-ink"
              }`}
            >
              {option.label}
            </button>
          ))}
          <span aria-hidden="true" className="w-px self-stretch bg-line" />
          {STATUS_FILTERS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={status === option.value}
              onClick={() => setStatus(option.value)}
              className={`ui-caps rounded-md border px-2.5 py-1 text-2xs ${
                status === option.value
                  ? "border-transparent bg-cta text-cta-fg"
                  : "border-line-strong bg-card text-ink-soft hover:text-ink"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-line bg-card shadow-sm">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead className="bg-raised text-[10px] text-muted">
            <tr className="border-b border-line">
              {["Name", "Role", "Last active", "Status"].map((heading) => (
                <th key={heading} scope="col" className="whitespace-nowrap px-5 py-3 font-medium uppercase tracking-[0.12em]">
                  <span className="inline-flex items-center gap-1">{heading} <span aria-hidden="true" className="text-[9px]">↕</span></span>
                </th>
              ))}
              <th scope="col" className="px-5 py-3 text-right font-medium uppercase tracking-[0.12em]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {members.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center">
                  <p className="text-sm text-ink">No accounts yet.</p>
                  <p className="mt-1 text-sm text-muted">Create the first staff account to get started.</p>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center">
                  <p className="text-sm text-ink">No matches.</p>
                  <p className="mt-1 text-sm text-muted">Try a different name, email, or filter.</p>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-4 text-xs text-accent-ink underline underline-offset-2 hover:text-ink"
                  >
                    Clear search and filters
                  </button>
                </td>
              </tr>
            ) : filtered.map((member) => {
              const isMe = member.id === currentUserId;
              return (
                <tr key={member.id} className="transition-colors hover:bg-raised">
                  <td className="px-5 py-3 font-medium text-ink">
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#7044e5] text-[11px] font-semibold text-white">
                        {initials(member.full_name, member.email)}
                      </span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-2">
                          <span className="truncate">{member.full_name?.trim() || "Unnamed"}</span>
                          {isMe && <Badge tone="neutral">You</Badge>}
                        </span>
                        <span className="block max-w-56 truncate text-xs font-normal text-muted" title={member.email}>{member.email}</span>
                      </span>
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-ink-soft">{ROLE_LABELS[member.role]}</td>
                  <td className="px-5 py-3 text-xs text-ink-soft">
                    <span className="block">{relativeDate(member.created_at)}</span>
                    <span className="mt-0.5 block text-[10px] text-muted">
                      {new Date(member.created_at).toLocaleString("en-PH", { dateStyle: "short", timeStyle: "short" })}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {member.is_active ? (
                      <Badge tone={member.on_shift ? "success" : "neutral"}>{member.on_shift ? "Active" : "Away"}</Badge>
                    ) : (
                      <Badge tone="danger">Suspended</Badge>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right align-top">
                    {member.role === "customer" ? (
                      <AddToTeamRow member={member} />
                    ) : isMe ? (
                      <span className="text-xs text-muted">Current account</span>
                    ) : (
                      <MemberControls member={member} />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

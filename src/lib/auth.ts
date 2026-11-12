import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getServerToken } from "@/lib/server-token";
import { checkSession, sessionReturnTo } from "@/lib/session";
import type { Profile, Role } from "@/types/database";

export type CurrentUser = {
  id: string;
  email: string;
  profile: Profile | null;
  role: Role;
  isActive: boolean;
  permissions: string[];
};

/** Memoised per request so all server-rendered account controls agree. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const requestHeaders = await headers();
  // This public recovery page must render even while the session service is down.
  if (requestHeaders.get("x-pathname") === "/session-unavailable") return null;
  const result = await checkSession(await getServerToken());
  if (result.status === "unavailable") {
    const next = sessionReturnTo(requestHeaders.get("x-session-return-to"));
    redirect(`/session-unavailable?next=${encodeURIComponent(next)}`);
  }
  if (result.status !== "authenticated") return null;
  const user = result.account;
  return {
    id: user._id,
    email: user.email,
    profile: { id: user._id, full_name: user.full_name, phone: user.phone, role: user.role,
      is_active: user.is_active, created_at: user.created_at },
    role: user.role,
    isActive: user.is_active,
    permissions: user.permissions,
  };
});

export function accessOf(user: CurrentUser | null) {
  return user ? { role: user.role, isActive: user.isActive } : null;
}

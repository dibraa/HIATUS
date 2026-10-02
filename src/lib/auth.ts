import { cache } from "react";
import { getServerToken } from "@/lib/server-token";
import { apiJson } from "@/lib/api-client";
import type { Profile, Role } from "@/types/database";

export type CurrentUser = {
  id: string;
  email: string;
  profile: Profile | null;
  role: Role;
  isActive: boolean;
};

/**
 * Memoised per request: the navbar, the page and the footer all ask who is
 * signed in, and without `cache` each would make its own `/auth/me` round trip.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = await getServerToken();
  if (!token) return null;

  try {
    const user = await apiJson<{
      _id: string;
      email: string;
      full_name: string | null;
      phone: string | null;
      role: Role;
      is_active: boolean;
      created_at: string;
    }>("/auth/me", { token });

    const profile: Profile = {
      id: user._id,
      full_name: user.full_name,
      phone: user.phone,
      role: user.role,
      is_active: user.is_active,
      created_at: user.created_at,
    };

    return {
      id: user._id,
      email: user.email,
      profile,
      role: user.role,
      isActive: user.is_active,
    };
  } catch {
    return null;
  }
});

export function accessOf(user: CurrentUser | null) {
  return user ? { role: user.role, isActive: user.isActive } : null;
}

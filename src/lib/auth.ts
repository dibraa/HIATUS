import { createClient } from "@/lib/supabase/server";
import type { Profile, Role } from "@/types/database";

/**
 * The signed-in person and what they may do, for Server Components.
 *
 * Layouts, the navbar and half a dozen pages all needed the same two facts —
 * "who is this" and "what role" — and each had grown its own copy of the same
 * two queries. This is the one implementation.
 *
 * Returns null for `profile` rather than throwing when a session exists but no
 * profile row does. That gap is real: the row is created by an `auth.users`
 * trigger, and a signup interrupted between the two leaves an account with no
 * profile. Treating it as "no permissions" degrades correctly; throwing would
 * turn it into a 500 on every page.
 */
export type CurrentUser = {
  id: string;
  email: string;
  profile: Profile | null;
  role: Role;
  isActive: boolean;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();

  // getUser(), not getSession(): only the former revalidates the JWT with the
  // auth server. A session read from a cookie is whatever the cookie says.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  return {
    id: user.id,
    email: user.email ?? "",
    profile: profile ?? null,
    // A missing profile is read as the least privilege that exists, never as
    // a default that happens to be convenient.
    role: profile?.role ?? "customer",
    isActive: profile?.is_active ?? false,
  };
}

/** The access shape src/lib/roles.ts helpers take. */
export function accessOf(user: CurrentUser | null) {
  return user ? { role: user.role, isActive: user.isActive } : null;
}

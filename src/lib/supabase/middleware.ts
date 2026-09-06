import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  ADMIN_PREFIX,
  AUTH_REQUIRED_PREFIXES,
  STAFF_PREFIX,
  isAdmin,
  isStaff,
} from "@/lib/roles";
import type { Role } from "@/types/database";

/**
 * Session refresh and the request-time role gate.
 *
 * This is the FIRST of three checks, not the only one. Each area also re-checks
 * in its layout (a Server Component redirect) and the database re-checks in RLS
 * and in every security-definer RPC. That redundancy is deliberate: this gate
 * is about not rendering a page someone cannot use, and only the database gate
 * is about not leaking data. Deleting this file should cost a nice error
 * message, never a permission.
 */
export async function updateSession(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);
  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request: { headers: requestHeaders },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const wantsAdmin = path.startsWith(ADMIN_PREFIX);
  const wantsStaff = path.startsWith(STAFF_PREFIX);
  const requiresAuth =
    wantsAdmin ||
    wantsStaff ||
    AUTH_REQUIRED_PREFIXES.some((prefix) => path.startsWith(prefix));

  if (requiresAuth && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    // Carries the intended destination so signing in resumes the journey
    // rather than dumping the visitor on the storefront.
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  // The profile read only happens for the two gated areas — every other authed
  // route (cart, orders, profile) needs a session, not a role, and a query per
  // request for a fact those pages never use is a cost with no return.
  if ((wantsAdmin || wantsStaff) && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_active")
      .eq("id", user.id)
      .single<{ role: Role; is_active: boolean }>();

    const access = profile
      ? { role: profile.role, isActive: profile.is_active }
      : null;

    const allowed = wantsAdmin ? isAdmin(access) : isStaff(access);

    if (!allowed) {
      const url = request.nextUrl.clone();
      // Staff who wandered into /admin land on the queue they can use, rather
      // than on a storefront that tells them nothing about why they bounced.
      url.pathname = wantsAdmin && isStaff(access) ? STAFF_PREFIX : "/";
      url.searchParams.set("denied", wantsAdmin ? "admin" : "staff");
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import {
  ADMIN_PREFIX,
  AUTH_REQUIRED_PREFIXES,
  STAFF_PREFIX,
  isAdmin,
  isStaff,
  CUSTOMER_ONLY_PREFIXES,
  homePathFor,
} from "@/lib/roles";
import type { Role } from "@/types/database";

// The fallback is public (it is in this file), so a token signed with it can
// be forged by anyone and would pass every role check below. Development keeps
// it so the app runs without a .env; production refuses to start without one.
const DEV_FALLBACK_SECRET = "change_this_secret";
if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET is not set. Set it to the same value the Express backend signs tokens with.");
  }
  console.warn("[proxy] JWT_SECRET is not set; using the development fallback secret.");
}
const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? DEV_FALLBACK_SECRET);

export async function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);

  const path = request.nextUrl.pathname;
  const wantsAdmin = path.startsWith(ADMIN_PREFIX);
  const wantsStaff = path.startsWith(STAFF_PREFIX);
  const wantsCustomerArea =
    path === "/" || CUSTOMER_ONLY_PREFIXES.some((prefix) => path.startsWith(prefix));
  const requiresAuth =
    wantsAdmin ||
    wantsStaff ||
    AUTH_REQUIRED_PREFIXES.some((prefix) => path.startsWith(prefix));

  const token = request.cookies.get("token")?.value ?? null;

  let role: Role | null = null;
  const isActive = true;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, secret);
      role = (payload as { role: Role }).role ?? null;
    } catch {
      // expired or invalid token — treat as logged out
    }
  }

  const access = role ? { role, isActive } : null;

  if (requiresAuth && !role) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  if (wantsCustomerArea && isStaff(access)) {
    const url = request.nextUrl.clone();
    url.pathname = homePathFor(role!);
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (wantsAdmin && !isAdmin(access)) {
    const url = request.nextUrl.clone();
    url.pathname = isStaff(access) ? STAFF_PREFIX : "/";
    url.searchParams.set("denied", "admin");
    return NextResponse.redirect(url);
  }

  if (wantsStaff && isAdmin(access)) {
    const url = request.nextUrl.clone();
    url.pathname = ADMIN_PREFIX;
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (wantsStaff && !isStaff(access)) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("denied", "staff");
    return NextResponse.redirect(url);
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

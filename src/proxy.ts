import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import {
  ADMIN_PREFIX,
  AUTH_REQUIRED_PREFIXES,
  STAFF_PREFIX,
  isAdmin,
  isStaffOnly,
  isStaff,
  CUSTOMER_ONLY_PREFIXES,
} from "@/lib/roles";
import type { Role } from "@/types/database";

const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? "change_this_secret");

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
  let isActive = true;

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

  if (wantsCustomerArea && isStaffOnly(access)) {
    const url = request.nextUrl.clone();
    url.pathname = STAFF_PREFIX;
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (wantsAdmin && !isAdmin(access)) {
    const url = request.nextUrl.clone();
    url.pathname = isStaff(access) ? STAFF_PREFIX : "/";
    url.searchParams.set("denied", "admin");
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

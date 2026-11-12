import { pagePermission, firstAllowed } from "@/lib/permissions";
import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import {
  ADMIN_PREFIX,
  AUTH_REQUIRED_PREFIXES,
  STAFF_PREFIX,
  isAdmin,
  isStaff,
  CUSTOMER_ONLY_PREFIXES,
} from "@/lib/roles";
import type { Role } from "@/types/database";
import { checkSession, sessionReturnTo } from "@/lib/session";
import { USE_MOCKS } from "@/lib/mock-staff-data";

// The fallback is public (it is in this file), so a token signed with it can
// be forged by anyone and would pass every role check below. Development keeps
// it so the app runs without a .env; production refuses to start without one.
const DEV_FALLBACK_SECRET = "change_this_secret";
if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "JWT_SECRET is not set. Set it to the same value the Express backend signs tokens with.",
    );
  }
  console.warn(
    "[proxy] JWT_SECRET is not set; using the development fallback secret.",
  );
}
const secret = new TextEncoder().encode(
  process.env.JWT_SECRET ?? DEV_FALLBACK_SECRET,
);

export async function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);
  requestHeaders.set("x-session-return-to", request.nextUrl.pathname + request.nextUrl.search);

  const path = request.nextUrl.pathname;
  const wantsAdmin = path.startsWith(ADMIN_PREFIX);
  const wantsStaff = path.startsWith(STAFF_PREFIX);
  const wantsCustomerArea =
    path === "/" ||
    CUSTOMER_ONLY_PREFIXES.some((prefix) => path.startsWith(prefix));
  const requiresAuth =
    wantsAdmin ||
    wantsStaff ||
    AUTH_REQUIRED_PREFIXES.some((prefix) => path.startsWith(prefix));

  const token = request.cookies.get("token")?.value ?? null;

  let role: Role | null = null;
  let permissions: string[] = [];
  const isActive = true;

  let rejected = false;
  if (token && path !== "/session-unavailable") {
    try { await jwtVerify(token, secret); }
    catch { rejected = true; }
    if (!rejected && (requiresAuth || wantsCustomerArea || path === "/login" || path === "/signup")) {
      const session = await checkSession(token);
      if (session.status === "unavailable") {
        const url = request.nextUrl.clone();
        url.pathname = "/session-unavailable";
        url.search = "";
        url.searchParams.set("next", sessionReturnTo(path + request.nextUrl.search));
        return NextResponse.redirect(url);
      }
      if (session.status === "authenticated") {
        role = session.account.role;
        permissions = session.account.permissions;
      } else rejected = true;
    }
  }
  const finish = (response: NextResponse) => {
    if (rejected) response.cookies.delete("token");
    return response;
  };
  if (rejected) {
    const cookie = (requestHeaders.get("cookie") ?? "").split(";").filter(part => part.trim().split("=")[0] !== "token").join(";");
    requestHeaders.set("cookie", cookie);
  }
  if (role && path === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = role === "customer" ? "/" : firstAllowed(role, permissions);
    url.search = "";
    return NextResponse.redirect(url);
  }

  const access = role ? { role, isActive } : null;

  // Frontend-first preview: the staff workspace renders from mock data with
  // no backend running, so its routes skip the auth gate while USE_MOCKS is on.
  if (USE_MOCKS && wantsStaff) {
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  if (requiresAuth && !role) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("next", path + request.nextUrl.search);
    return finish(NextResponse.redirect(url));
  }

  if (wantsCustomerArea && isStaff(access)) {
    const url = request.nextUrl.clone();
    url.pathname = firstAllowed(role!, permissions);
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
    url.pathname = path.startsWith("/staff/pos/receipt/") ? "/admin/orders/" + path.split("/").pop() + "/receipt" : firstAllowed(role!, permissions);
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (wantsStaff && !isStaff(access)) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("denied", "staff");
    return NextResponse.redirect(url);
  }

  if (role && (wantsAdmin || wantsStaff) && !path.startsWith("/staff/pos/receipt") && pagePermission(path, request.nextUrl.searchParams.get("view") || "").some(key => !key.split("|").some(option => permissions.includes(option)))) {
    const url = request.nextUrl.clone();
    url.pathname = firstAllowed(role, permissions);
    url.search = "";
    return NextResponse.redirect(url);
  }
  return finish(NextResponse.next({ request: { headers: requestHeaders } }));
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

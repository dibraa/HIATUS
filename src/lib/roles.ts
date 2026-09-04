import type { Role } from "@/types/database";

/**
 * Role logic, in one place.
 *
 * The rule the whole app follows: authority is CUMULATIVE. An admin can do
 * everything a staff member can, so counter work asks `isStaff()` — which is
 * true for both — and only the books ask `isAdmin()`.
 *
 * Nothing anywhere should compare `role === "staff"` directly. That test reads
 * as "is this person on the counter" but means "is this person NOT the owner",
 * and it is how an owner ends up locked out of their own order queue.
 *
 * `is_active` is folded into both checks for the same reason it is folded into
 * the SQL helpers: a deactivated account must lose access immediately, not at
 * its next login.
 */

export type Access = { role: Role; isActive: boolean };

export function isStaff(access: Access | null | undefined): boolean {
  if (!access?.isActive) return false;
  return access.role === "staff" || access.role === "admin";
}

export function isAdmin(access: Access | null | undefined): boolean {
  if (!access?.isActive) return false;
  return access.role === "admin";
}

export const ROLE_LABELS: Record<Role, string> = {
  customer: "Customer",
  staff: "Staff",
  admin: "Admin",
};

/** What each role can reach, written once so the nav and the guard agree. */
export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  customer: "Orders for themselves. No access to the counter or the books.",
  staff: "Works the queue, takes payment, marks drinks sold out.",
  admin: "Everything staff can do, plus the menu, the team and the reports.",
};

/**
 * Where each role lands after signing in.
 *
 * A barista signing in should arrive at the queue, not the storefront — the
 * queue is the entire reason they opened the app.
 */
export function homePathFor(role: Role): string {
  if (role === "admin") return "/admin";
  if (role === "staff") return "/staff";
  return "/";
}

/** Route prefixes that require a signed-in account of at least the given role. */
export const ADMIN_PREFIX = "/admin";
export const STAFF_PREFIX = "/staff";
export const AUTH_REQUIRED_PREFIXES = [
  "/checkout",
  "/orders",
  "/profile",
  "/favorites",
];

import type { Role } from "@/types/database";

/**
 * Role logic, in one place.
 *
 * Shared operational reads use `isStaff()` for staff and admin. Counter
 * operations use `isStaffOnly()`; administrators manage orders through the
 * separate admin workspace and cannot open the Staff Counter.
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

export function isStaffOnly(access: Access | null | undefined): boolean {
  if (!access?.isActive) return false;
  return access.role === "staff";
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
  admin: "Manages users, menus, orders, reports, and settings within their account permissions.",
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
  "/cart",
  "/checkout",
  "/orders",
  "/profile",
  "/favorites",
];

export const CUSTOMER_ONLY_PREFIXES = [
  "/cart",
  "/checkout",
  "/orders",
  "/profile",
  "/favorites",
  "/menu",
];

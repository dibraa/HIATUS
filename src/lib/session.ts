import type { Role } from "@/types/database";

export type SessionAccount = {
  _id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: Role;
  is_active: boolean;
  created_at: string;
  permissions: string[];
};
export type SessionResult =
  | { status: "authenticated"; account: SessionAccount }
  | { status: "anonymous" }
  | { status: "invalid" }
  | { status: "unavailable" };

/** A service outage must never be mistaken for a rejected session. */
export async function checkSession(token: string | null): Promise<SessionResult> {
  if (!token) return { status: "anonymous" };
  try {
    const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
    const response = await fetch(`${base}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (response.status === 401 || response.status === 403) return { status: "invalid" };
    if (!response.ok) return { status: "unavailable" };
    const account = await response.json() as SessionAccount;
    if (!["customer", "staff", "admin"].includes(account.role) || typeof account.is_active !== "boolean" ||
      typeof account._id !== "string" || typeof account.email !== "string" ||
      !Array.isArray(account.permissions) || !account.permissions.every(value => typeof value === "string")) {
      return { status: "unavailable" };
    }
    if (!account.is_active) return { status: "invalid" };
    return { status: "authenticated", account };
  } catch {
    return { status: "unavailable" };
  }
}

/** Only local page destinations can be resumed from a session error. */
export function sessionReturnTo(value?: string | null): string {
  if (!value?.startsWith("/") || value.startsWith("//") || /[\\\r\n]/.test(value)) return "/";
  const pathname = value.split(/[?#]/)[0];
  if (["/login", "/signup", "/session-unavailable"].includes(pathname)) return "/";
  return value;
}

/**
 * Client-side token helper.
 * Reads the JWT from localStorage (set by the login action via a cookie).
 */
export function getClientToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

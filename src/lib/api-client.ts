/**
 * Thin fetch wrapper that talks to the Express backend.
 * Used by server actions (server-side) and client components alike.
 *
 * On the server, the JWT is read from the `token` cookie via the
 * `getServerToken()` helper below. On the client it is read from localStorage.
 */

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export async function apiFetch(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<Response> {
  const { token, ...rest } = options;
  const headers: Record<string, string> = { ...(rest.headers as Record<string, string>) };
  if (!(rest.body instanceof FormData)) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  // A network failure rejects with the runtime's own wording ("fetch failed"),
  // which every server action would otherwise pass straight to the page.
  // Errors the API itself returns are left alone — those are written for people.
  try {
    return await fetch(`${BASE}${path}`, { ...rest, headers });
  } catch {
    throw new Error("We couldn't reach the server. Check your connection and try again.");
  }
}

export async function apiJson<T>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const res = await apiFetch(path, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? "Request failed");
  return data as T;
}

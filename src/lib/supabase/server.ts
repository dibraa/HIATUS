/**
 * Server-side token helper.
 * Reads the JWT from the `token` cookie set by the login action.
 */
import { cookies } from "next/headers";

export async function getServerToken(): Promise<string | null> {
  const store = await cookies();
  return store.get("token")?.value ?? null;
}

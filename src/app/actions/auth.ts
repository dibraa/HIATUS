"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { apiJson } from "@/lib/api-client";
import { homePathFor } from "@/lib/roles";
import type { Role } from "@/types/database";

export type AuthState = { error: string | null; success?: string | null; email?: string };
export type ResetState = { error: string | null; sent: boolean };
export type PasswordState = { error: string | null; success: boolean };

export async function signIn(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");

  let token: string;
  let role: Role;

  try {
    ({ token, role } = await apiJson<{ token: string; role: Role }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }));

    const store = await cookies();
    store.set("token", token, { httpOnly: true, path: "/", maxAge: 60 * 60 * 24 * 7, sameSite: "lax" });
  } catch (err: unknown) {
    // Hand the address back: React resets the form after the action, and
    // retyping an email because the password was wrong is pure friction.
    return { error: (err as Error).message, email };
  }

  if (isSafeNext(next)) redirect(next);
  redirect(homePathFor(role));
}

/**
 * `next` arrives in the URL, so anyone can write a link that sets it. Only a
 * path on this site is followed: `https://…`, and the protocol-relative
 * `//host` and `/\host` (which browsers read as `//host`), would send a
 * freshly signed-in person to someone else's page.
 */
function isSafeNext(next: string): boolean {
  return next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\");
}

export async function signUp(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  // `required` in the browser accepts a name of only spaces; trimmed, that is
  // an empty name the counter would have to call out at pickup.
  if (!fullName) return { error: "Enter your name so we can call it at pickup." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Please enter email address" };
  }
  if (phone && !/^\d+$/.test(phone)) {
    return { error: "Phone number must contain numbers only" };
  }
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  try {
    await apiJson("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password, full_name: fullName, phone }),
    });
    return { error: null, success: "Your account was created successfully." };
  } catch (err: unknown) {
    return { error: (err as Error).message };
  }
}

export async function signOut() {
  const store = await cookies();
  store.delete("token");
  redirect("/login");
}

// Password reset is not implemented in the Express backend yet — kept as stubs
// so the existing forgot/reset pages compile without changes.
export async function requestPasswordReset(
  _prev: ResetState,
  formData: FormData
): Promise<ResetState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Enter the email address you signed up with.", sent: false };
  // TODO: implement reset email via Express + nodemailer. Until then, say so
  // rather than report an email that was never sent.
  return {
    error: "Password reset by email isn't available yet. Ask at the counter and we'll reset it for you.",
    sent: false,
  };
}

export async function updatePassword(
  _prev: PasswordState,
  formData: FormData
): Promise<PasswordState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm_password") ?? "");
  if (password.length < 8) return { error: "Password must be at least 8 characters.", success: false };
  if (password !== confirm) return { error: "The two passwords do not match.", success: false };
  // TODO: implement via Express
  return { error: "Password reset via email is not yet configured.", success: false };
}

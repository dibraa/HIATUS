"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { apiFetch, apiJson } from "@/lib/api-client";
import { homePathFor } from "@/lib/roles";
import type { Role } from "@/types/database";
import { createHash, randomBytes } from "node:crypto";

const RESET_UNAVAILABLE = "Password reset is temporarily unavailable. Please try again later.";

export type AuthState = { error: string | null; success?: string | null; email?: string };
export type ResetState = { error: string | null; sent: boolean };
export type PasswordState = { error: string | null; success: boolean; expired?: boolean };

export async function signIn(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");

  let token: string;
  let role: Role;

  try {
    const response = await apiJson<{ token: string; user: { role: Role } }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password, recaptcha_token: String(formData.get("recaptcha_token") ?? "") }),
    });
    token = response.token;
    role = response.user.role;

    const store = await cookies();
    store.set("token", token, { httpOnly: true, path: "/", maxAge: 60 * 60 * 24 * 7, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
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

export async function beginGoogleAuthentication(intent: "login" | "signup"): Promise<{ nonce?: string; error?: string }> {
  if (intent !== "login" && intent !== "signup") return { error: "Invalid sign-in request." };
  try {
    const verifier = randomBytes(32).toString("base64url");
    const result = await apiJson<{ nonce: string }>("/auth/google/challenge", {
      method: "POST",
      body: JSON.stringify({ intent, browser_hash: createHash("sha256").update(verifier).digest("hex") }),
    });
    (await cookies()).set("google_auth", verifier, {
      httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 600,
    });
    return result;
  } catch (error) {
    return { error: (error as Error).message };
  }
}

export async function signInWithGoogle(formData: FormData): Promise<{ error: string; code?: string }> {
  let role: Role;
  const next = String(formData.get("next") ?? "");
  try {
    const store = await cookies();
    const verifier = store.get("google_auth")?.value;
    if (!verifier) return { error: "Google sign-in expired. Please start again.", code: "CHALLENGE_EXPIRED" };
    const res = await apiFetch("/auth/google", {
      method: "POST",
      body: JSON.stringify({
        credential: String(formData.get("credential") ?? ""), nonce: String(formData.get("nonce") ?? ""),
        password: String(formData.get("password") ?? ""), recaptcha_token: String(formData.get("recaptcha_token") ?? ""),
        browser_hash: createHash("sha256").update(verifier).digest("hex"),
      }),
    });
    const data = await res.json() as { error?: string; code?: string; token: string; user: { role: Role } };
    if (!res.ok) return { error: data.error || "Google sign-in failed. Please try again.", code: data.code };
    store.delete("google_auth");
    store.set("token", data.token, {
      httpOnly: true, path: "/", maxAge: 60 * 60 * 24 * 7, sameSite: "lax", secure: process.env.NODE_ENV === "production",
    });
    role = data.user.role;
  } catch (error) {
    return { error: (error as Error).message };
  }
  if (isSafeNext(next)) redirect(next);
  redirect(homePathFor(role));
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

/**
 * Step 1: email a one-time reset link (POST /auth/forgot-password).
 */
export async function requestPasswordReset(
  _prev: ResetState,
  formData: FormData
): Promise<ResetState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Enter the email address you signed up with.", sent: false };
  }
  try {
    const res = await apiFetch("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    if (res.status === 404) {
      return { error: "No account is registered with that email address.", sent: false };
    }
    if (res.status === 429) {
      return { error: "Too many reset requests. Wait a few minutes and try again.", sent: false };
    }
    if (!res.ok) return { error: "We couldn't send the reset email. Try again in a moment.", sent: false };
    return { error: null, sent: true };
  } catch (err: unknown) {
    return { error: (err as Error).message, sent: false };
  }
}

/**
 * Step 2: set the new password with the token from the emailed link
 * (POST /auth/reset-password). The API checks the token is real, unused and
 * under an hour old, then retires it, so the link works exactly once.
 */
export async function updatePassword(
  _prev: PasswordState,
  formData: FormData
): Promise<PasswordState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm_password") ?? "");
  if (!token) return { error: "This reset link is incomplete. Request a new one.", success: false };
  if (password.length < 8) return { error: "Password must be at least 8 characters.", success: false };
  if (password !== confirm) return { error: "The two passwords do not match.", success: false };

  try {
    const res = await apiFetch("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, password }),
    });
    if (res.ok) return { error: null, success: true };
    if (res.status === 404) return { error: RESET_UNAVAILABLE, success: false };
    if (res.status === 400 || res.status === 410) {
      return { error: "This reset link has expired or was already used. Request a new one.", success: false, expired: true };
    }
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    return { error: data.error ?? "We couldn't change your password. Try again in a moment.", success: false };
  } catch (err: unknown) {
    return { error: (err as Error).message, success: false };
  }
}

"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { homePathFor } from "@/lib/roles";

export type AuthState = { error: string | null };
export type ResetState = { error: string | null; sent: boolean };
export type PasswordState = { error: string | null; success: boolean };

export async function signIn(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message };
  }

  // A barista signing in should land on the queue and an owner on the
  // dashboard — the storefront is not what either of them opened the app for.
  // An explicit `next` (from the auth guard) still wins, because that is a
  // journey the person was already partway through.
  if (next) redirect(next);

  const user = await getCurrentUser();
  redirect(user ? homePathFor(user.role) : "/");
}

export async function signUp(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "");
  const phone = String(formData.get("phone") ?? "").trim();

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    // Passed as metadata because the profile row is created by an auth trigger
    // (`handle_new_user`), which reads exactly this. Writing to `profiles`
    // here instead would race the trigger.
    options: { data: { full_name: fullName, phone } },
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/");
}

/**
 * The origin the reset link should point back at.
 *
 * Read from the request rather than a hardcoded env var so the flow works
 * unchanged on localhost, on a preview deployment and in production. Falls
 * back to an explicit site URL if one is configured, because `x-forwarded-host`
 * is only trustworthy behind a proxy that sets it.
 */
async function siteOrigin(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const protocol = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

/**
 * Step one of a password reset: email a one-time link.
 *
 * Always reports success, even for an address with no account. Saying "no
 * account found" turns this form into a way to test whether a given email is a
 * customer here, which is not something a stranger should be able to learn.
 * The person who owns the address gets the mail; nobody else learns anything.
 */
export async function requestPasswordReset(
  _prev: ResetState,
  formData: FormData
): Promise<ResetState> {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) return { error: "Enter the email address you signed up with.", sent: false };

  const supabase = await createClient();
  const origin = await siteOrigin();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirm?next=/reset-password`,
  });

  // Rate limiting is the one failure worth surfacing — it is about the
  // request, not about whether the account exists.
  if (error && error.status === 429) {
    return { error: "Too many attempts. Wait a minute and try again.", sent: false };
  }

  return { error: null, sent: true };
}

/** Step two: the link has been followed and a session exists; set the password. */
export async function updatePassword(
  _prev: PasswordState,
  formData: FormData
): Promise<PasswordState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm_password") ?? "");

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters.", success: false };
  }
  if (password !== confirm) {
    return { error: "The two passwords do not match.", success: false };
  }

  const supabase = await createClient();

  // The recovery link created a real session, so this is an ordinary update.
  // If the link expired there is no session and Supabase refuses — which is
  // the correct outcome, not something to work around.
  const { error } = await supabase.auth.updateUser({ password });

  if (error) return { error: error.message, success: false };

  return { error: null, success: true };
}

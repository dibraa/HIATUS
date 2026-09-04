import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Where Supabase's emailed links land.
 *
 * A recovery (or confirmation) link carries a one-time code that has to be
 * exchanged for a real session before any authenticated page will work. That
 * exchange has to happen server-side — it sets the auth cookies — which is why
 * this is a Route Handler and not a page.
 *
 * The `next` parameter is validated as a same-origin PATH rather than trusted
 * as given. Without that check, `/auth/confirm?next=https://evil.example` is an
 * open redirect that arrives via an email the app itself sent — the most
 * credible-looking phishing hop there is.
 */
function safeNext(raw: string | null): string {
  if (!raw) return "/";
  // Must be a path, and must not be protocol-relative ("//host" is absolute).
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing-code`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    // Almost always an expired or already-used link. The login page says so
    // rather than dumping the raw error, which is unhelpfully technical.
    return NextResponse.redirect(`${origin}/login?error=link-expired`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}

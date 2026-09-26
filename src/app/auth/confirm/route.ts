import { NextResponse, type NextRequest } from "next/server";

// Supabase email confirmation is no longer used — redirect to login.
export async function GET(request: NextRequest) {
  const { origin } = request.nextUrl;
  return NextResponse.redirect(`${origin}/login`);
}

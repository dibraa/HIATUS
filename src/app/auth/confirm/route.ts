import { NextResponse, type NextRequest } from "next/server";

// Old reset emails pointed here. Reset links now go straight to
// /reset-password?token=…, so anything still arriving is a stale link.
export async function GET(request: NextRequest) {
  const { origin } = request.nextUrl;
  return NextResponse.redirect(`${origin}/login?error=link-expired`);
}

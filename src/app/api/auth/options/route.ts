import { getAuthenticationOptions } from "@/lib/authentication-options";

export async function GET() {
  const result = await getAuthenticationOptions();
  return Response.json(result, {
    status: result.options ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}

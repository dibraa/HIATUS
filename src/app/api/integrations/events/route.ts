import { forwardIntegration } from "@/lib/integration-proxy";
export async function POST(request: Request) {
  return forwardIntegration(request, "events");
}

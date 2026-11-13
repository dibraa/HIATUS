import { apiJson } from "@/lib/api-client";

export async function sendTestPush(subscription: { endpoint: string }, token: string): Promise<void> {
  const policy = await apiJson<{ push_enabled: boolean; push_provider: string }>("/settings/integrations/options", { cache: "no-store" });
  if (!policy.push_enabled || policy.push_provider === "onesignal") throw new Error("Browser push is disabled.");
  if (!token) throw new Error("Log in to test notifications.");
  await apiJson("/account/push-test", { token, method: "POST", body: JSON.stringify({ endpoint: subscription.endpoint }) });
}

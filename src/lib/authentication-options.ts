import { apiJson } from "@/lib/api-client";

export type AuthenticationOptions = {
  google_enabled: boolean;
  recaptcha_enabled: boolean;
  google_client_id: string | null;
  recaptcha_site_key: string | null;
};

export type AuthenticationSettings = {
  google_enabled: boolean;
  recaptcha_enabled: boolean;
  google_ready: boolean;
  recaptcha_ready: boolean;
};

export type AuthenticationResult = { options: AuthenticationOptions | null; error: string | null };

export function isAuthenticationOptions(value: unknown): value is AuthenticationOptions {
  if (!value || typeof value !== "object") return false;
  const options = value as Partial<AuthenticationOptions>;
  return typeof options.google_enabled === "boolean" && typeof options.recaptcha_enabled === "boolean" &&
    (options.google_client_id === null || typeof options.google_client_id === "string") &&
    (options.recaptcha_site_key === null || typeof options.recaptcha_site_key === "string") &&
    (!options.google_enabled || Boolean(options.google_client_id)) &&
    (!options.recaptcha_enabled || Boolean(options.recaptcha_site_key));
}

export async function getAuthenticationOptions(): Promise<AuthenticationResult> {
  // A cold backend or a brief transport failure gets one fresh attempt before
  // the form reports unavailable providers. Never invent an off CAPTCHA policy.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const options = await apiJson<unknown>("/auth/options", { cache: "no-store", signal: AbortSignal.timeout(5000) });
      if (!isAuthenticationOptions(options)) throw new Error("Invalid sign-in options");
      return { options, error: null };
    } catch {
      // The API independently enforces the saved policy on password submission.
    }
  }
  return { options: null, error: "Additional sign-in options could not load. Retrying automatically. You can still try your email and password." };
}

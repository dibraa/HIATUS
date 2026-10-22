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
  try {
    const options = await apiJson<unknown>("/auth/options", { cache: "no-store", signal: AbortSignal.timeout(10000) });
    if (!isAuthenticationOptions(options)) throw new Error("Invalid sign-in options");
    return { options, error: null };
  } catch {
    // Do not assume CAPTCHA is disabled. Password submissions still go through
    // the API, which independently reads and enforces the current saved policy.
    return { options: null, error: "Additional sign-in options could not load. You can try your email and password, or refresh the sign-in options." };
  }
}

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

export async function getAuthenticationOptions(): Promise<
  { options: AuthenticationOptions; error: null } | { options: null; error: string }
> {
  try {
    const options = await apiJson<AuthenticationOptions>("/auth/options", { cache: "no-store" });
    return { options, error: null };
  } catch {
    // Never turn a security-policy read failure into an assumed disabled switch.
    return { options: null, error: "Sign-in options are unavailable. Reload this page to try again." };
  }
}

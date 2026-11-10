export type CredentialProvider = "google" | "smtp" | "recaptcha";
export type CredentialStatus = {
  revision: string;
  providers: Record<CredentialProvider, {
    source: "original" | "custom";
    configured: boolean;
    values: Record<string, string>;
    secrets: Record<string, boolean>;
  }>;
};
export type CredentialResult = { data: CredentialStatus | null; error: string | null };

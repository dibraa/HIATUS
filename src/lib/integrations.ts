export type IntegrationSettings = {
  report_export_enabled: boolean; push_enabled: boolean; password_email_enabled: boolean;
  email_enabled: boolean; cloudinary_enabled: boolean; posthog_enabled: boolean; sentry_enabled: boolean;
  email_provider: "smtp";
};
export type BrowserIntegrations = { native_vapid_public_key: string | null; push_enabled: boolean; report_export_enabled: boolean; posthog_enabled: boolean; sentry_enabled: boolean };

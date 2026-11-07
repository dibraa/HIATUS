export type IntegrationSettings = {
  report_export_enabled: boolean; push_enabled: boolean; password_email_enabled: boolean;
  resend_enabled: boolean; cloudinary_enabled: boolean; onesignal_enabled: boolean; posthog_enabled: boolean; sentry_enabled: boolean;
  email_provider: "smtp" | "resend"; push_provider: "native" | "onesignal";
};
export type BrowserIntegrations = { push_enabled: boolean; report_export_enabled: boolean; push_provider: "native" | "onesignal"; posthog_enabled: boolean; sentry_enabled: boolean; onesignal_app_id: string | null };

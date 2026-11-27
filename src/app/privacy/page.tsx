import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Notice" };

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 py-8">
      <header className="border-b border-line pb-4">
        <h1 className="display text-3xl text-ink">Hiatus Coffee Privacy Notice</h1>
        <p className="mt-2 text-sm text-muted">
          Issued in accordance with Republic Act No. 10173 (Data Privacy Act of 2012) and NPC Circular No. 2023-04.
        </p>
      </header>

      <section className="space-y-2 text-sm leading-6 text-ink-soft">
        <h2 className="text-lg font-semibold text-ink">1. Personal Information Controller</h2>
        <p>
          Hiatus Coffee operates the Hiatus Order-Ahead and Counter Management System and determines what personal
          data is collected and how it is processed. Privacy inquiries and Data Protection Officer (DPO) requests
          may be directed to the cafe management at the store counter or through the official contact email published
          by the cafe.
        </p>
      </section>

      <section className="space-y-2 text-sm leading-6 text-ink-soft">
        <h2 className="text-lg font-semibold text-ink">2. Data Collected &amp; Lawful Basis</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>Account &amp; order data</strong> (name, email address, optional phone number, order history, cash payment status): processed as necessary to fulfill your order-ahead contract (DPA Sec. 12(b)).</li>
          <li><strong>Authentication &amp; security records</strong> (bcrypt password hashes, one-time verification/reset hashes, session tokens, activity audit logs): processed to protect your account and system security.</li>
          <li><strong>Public review display name</strong> (optional): published with your full name only if you give separate, unbundled opt-in consent on the review form; otherwise only your initials are shown.</li>
        </ul>
      </section>

      <section className="space-y-2 text-sm leading-6 text-ink-soft">
        <h2 className="text-lg font-semibold text-ink">3. Recipients &amp; Service Providers</h2>
        <p>
          Hiatus does not sell personal data. Infrastructure processors used when enabled by the administrator include
          MongoDB Atlas (database hosting), Gmail SMTP (transactional verification, receipt, and reset emails), and
          optional Google Sign-In, Google reCAPTCHA, Cloudinary media storage, Web Push services, PostHog analytics
          (respecting Do Not Track), and Sentry error monitoring.
        </p>
      </section>

      <section className="space-y-2 text-sm leading-6 text-ink-soft">
        <h2 className="text-lg font-semibold text-ink">4. Retention Periods</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Order &amp; cash payment records: retained as required by applicable tax and business record rules, then anonymized.</li>
          <li>Customer reviews &amp; attachments: retained while the account is active and anonymized upon account deletion.</li>
          <li>Order notifications: automatically deleted after 90 days.</li>
          <li>Activity &amp; security logs: retained for up to 1 year; login lockouts and one-time challenges expire automatically.</li>
          <li>Inactive customer accounts: eligible for anonymization after 2 years without sign-in.</li>
        </ul>
      </section>

      <section className="space-y-2 text-sm leading-6 text-ink-soft">
        <h2 className="text-lg font-semibold text-ink">5. Your Rights as a Data Subject</h2>
        <p>
          Under DPA Secs. 16 and 18, you have the right to be informed, to access and export your personal data in
          JSON format, to correct inaccuracies, to request erasure or blocking of your account, to object to optional
          processing, and to lodge a complaint with the National Privacy Commission (NPC). You can download a copy of
          your data or delete your customer account directly from your Profile page.
        </p>
      </section>
    </main>
  );
}

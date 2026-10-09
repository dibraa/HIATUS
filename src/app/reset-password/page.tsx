import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { ResetPasswordForm } from "./reset-form";

export const metadata: Metadata = {
  title: "Set a new password",
  // The reset token is in this page's URL. "no-referrer" stops the browser
  // sending that URL to any other site a link or font request reaches.
  referrer: "no-referrer",
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  // The emailed link is /reset-password?token=…. Without a token there is
  // nothing to reset, so anyone arriving directly starts the flow instead of
  // filling in a form that cannot work.
  const { token } = await searchParams;
  if (!token) redirect("/forgot-password");

  return (
    <div className="mx-auto w-full max-w-lg py-6 sm:py-12">
      <div className="rounded-2xl border border-line bg-card p-5 shadow-lg sm:p-8">
        <PageHeader
          title="Set a new password"
          description="Choose something you have not used here before."
        />
        <ResetPasswordForm token={token} />
      </div>
    </div>
  );
}

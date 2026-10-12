import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthTicket } from "@/components/auth-ticket";
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
    <AuthTicket
      label="New password"
      title="Set a new password"
      description="Choose something you have not used here before."
    >
      <ResetPasswordForm token={token} />
    </AuthTicket>
  );
}

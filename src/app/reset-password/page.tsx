import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { getCurrentUser } from "@/lib/auth";
import { ResetPasswordForm } from "./reset-form";

export const metadata: Metadata = { title: "Set a new password" };

export default async function ResetPasswordPage() {
  // Reaching this page means the emailed link was exchanged for a session at
  // /auth/confirm. Without one there is nothing to update, so anyone arriving
  // directly is sent to start the flow rather than shown a form that cannot work.
  const user = await getCurrentUser();
  if (!user) redirect("/forgot-password");

  return (
    <div className="mx-auto max-w-sm py-8">
      <PageHeader
        title="Set a new password"
        description="Choose something you have not used here before."
      />
      <ResetPasswordForm />
    </div>
  );
}

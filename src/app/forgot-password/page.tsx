import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { ForgotPasswordForm } from "./forgot-form";

export const metadata: Metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto max-w-sm py-8">
      <PageHeader
        title="Reset your password"
        description="Enter your email and we will send you a link to set a new one."
      />
      <ForgotPasswordForm />
    </div>
  );
}

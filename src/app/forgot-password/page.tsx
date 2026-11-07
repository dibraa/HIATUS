import type { Metadata } from "next";
import { AuthTicket } from "@/components/auth-ticket";
import { ForgotPasswordForm } from "./forgot-form";

export const metadata: Metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  return (
    // No `footer`: ForgotPasswordForm carries its own way back to log in, in
    // both its form and its "link sent" states.
    <AuthTicket
      label="Reset"
      title="Reset your password"

    >
      <ForgotPasswordForm />
    </AuthTicket>
  );
}

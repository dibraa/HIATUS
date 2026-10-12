import Link from "next/link";
import type { Metadata } from "next";
import { AuthTicket } from "@/components/auth-ticket";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Create your account" };

export default function SignupPage() {
  return (
    <AuthTicket
      label="Sign up"
      title="Create your account"
      description="Ordering ahead needs a name and a way to reach you at pickup. Nothing else."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-accent-ink underline underline-offset-4 transition-colors hover:text-ink">
            Log in
          </Link>
        </>
      }
    >
      <SignupForm />
    </AuthTicket>
  );
}

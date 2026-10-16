import type { Metadata } from "next";
import { AuthTicket } from "@/components/auth-ticket";
import { TextLink } from "@/components/ui/text-link";
import { SignupForm } from "./signup-form";
import { getAuthenticationOptions } from "@/lib/authentication-options";

export const metadata: Metadata = { title: "Create your account" };

export default async function SignupPage() {
  const authentication = await getAuthenticationOptions();
  return (
    <AuthTicket
      label="Sign up"
      title="Create your account"
      description="Ordering ahead needs a name and a way to reach you at pickup. Nothing else."
      footer={
        <>
          Already have an account? <TextLink href="/login">Log in</TextLink>
        </>
      }
    >
      <SignupForm authentication={authentication} />
    </AuthTicket>
  );
}

import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthTicket } from "@/components/auth-ticket";
import { TextLink } from "@/components/ui/text-link";
import { ControlSkeleton, FieldSkeleton } from "@/components/ui/skeleton";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <AuthTicket
      label="Log in"
      title="Welcome back."
      description="Log in to order ahead and keep track of your cups."
      footer={
        <>
          No account yet? <TextLink href="/signup">Create one</TextLink>
        </>
      }
    >
      {/* Suspense: LoginForm reads the `next` search param, which opts the
          subtree into client-side rendering. */}
      <Suspense fallback={<FormSkeleton />}>
        <LoginForm />
      </Suspense>
    </AuthTicket>
  );
}

/** The real form's shape — two fields and the submit — so nothing jumps when
 *  it swaps in. */
function FormSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true">
      <FieldSkeleton />
      <FieldSkeleton />
      <ControlSkeleton className="mt-1" />
    </div>
  );
}

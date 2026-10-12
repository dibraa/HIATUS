import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { AuthTicket } from "@/components/auth-ticket";
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
          No account yet?{" "}
          <Link href="/signup" className="font-medium text-accent-ink underline underline-offset-4 transition-colors hover:text-ink">
            Create one
          </Link>
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

/** Matches the real form's height so the page does not jump when it swaps in. */
function FormSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-hidden="true">
      <div className="skeleton h-[70px] rounded-md" />
      <div className="skeleton h-[70px] rounded-md" />
      <div className="skeleton h-11 rounded-md" />
    </div>
  );
}

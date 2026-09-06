import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-sm py-6 sm:py-10">
      <PageHeader
        title="Log in to Hiatus"
        description="Your orders, order history and saved details live behind this."
      />

      {/* Suspense: LoginForm reads the `next` search param, which opts the
          subtree into client-side rendering. */}
      <Suspense fallback={<FormSkeleton />}>
        <LoginForm />
      </Suspense>

      <p className="mt-6 text-sm text-muted">
        No account yet?{" "}
        <Link
          href="/signup"
          className="font-medium text-accent-ink underline underline-offset-4 transition-colors hover:text-ink"
        >
          Create one
        </Link>
      </p>
    </div>
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

import Link from "next/link";
import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Create your account" };

export default function SignupPage() {
  return (
    <div className="mx-auto max-w-sm py-6 sm:py-10">
      <PageHeader
        title="Create your account"
        description="Ordering ahead needs a name and a way to reach you at pickup. Nothing else."
      />

      <SignupForm />

      <p className="mt-6 text-sm text-muted">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-accent-ink underline underline-offset-4 transition-colors duration-150 ease-hi hover:text-ink"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}

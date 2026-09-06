import Link from "next/link";
import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Create your account" };

export default function SignupPage() {
  return (
    <div className="mx-auto w-full max-w-lg py-3 sm:py-6">
      <div className="rounded-2xl border border-line bg-card p-5 shadow-lg sm:p-6">
        <PageHeader
          title="Create your account"
          className="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b border-line pb-4"
        />

        <SignupForm />

        <p className="mt-6 border-t border-line pt-5 text-sm text-muted">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-accent-ink underline underline-offset-4 transition-colors duration-150 ease-hi hover:text-ink"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

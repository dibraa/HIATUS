import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { sessionReturnTo } from "@/lib/session";

export const metadata: Metadata = { title: "Connection interrupted" };

export default async function SessionUnavailablePage({ searchParams }: {
  searchParams: Promise<{ next?: string }>;
}) {
  const next = sessionReturnTo((await searchParams).next);
  return (
    <section className="mx-auto max-w-lg py-12" aria-labelledby="session-heading">
      <h1 id="session-heading" className="display text-4xl text-ink">Connection interrupted</h1>
      <p className="mt-4 text-ink-soft">We couldn’t check your session. Try again in a moment.</p>
      <ButtonLink href={next} prefetch={false} className="mt-6">Try again</ButtonLink>
    </section>
  );
}

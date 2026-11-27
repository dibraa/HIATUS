import { VerifyEmailForm } from "./verify-email-form";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token = "" } = await searchParams;
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 py-12">
      <h1 className="display mb-4 text-2xl text-ink">Verify your email</h1>
      <VerifyEmailForm token={token} />
    </main>
  );
}

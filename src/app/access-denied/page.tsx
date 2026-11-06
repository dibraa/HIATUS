import { SignOutButton } from "@/components/sign-out-button";
export default function AccessDenied() { return <main className="mx-auto max-w-lg px-5 py-16"><h1 className="display text-3xl">Access unavailable</h1><p className="my-5 text-muted">Ask an administrator to update your account permissions.</p><SignOutButton /></main>; }

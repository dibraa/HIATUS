import { AuthTicket } from "@/components/auth-ticket";

/** Signup skeleton — the real ticket with placeholder fields, so nothing
 *  shifts when the form arrives. */
export default function Loading() {
  return (
    <div aria-busy="true">
      <p className="sr-only" role="status">
        Loading…
      </p>
      <AuthTicket
        label="Sign up"
        title="Create your account"
        description="Ordering ahead needs a name and a way to reach you at pickup. Nothing else."
      >
        <div className="flex flex-col gap-4" aria-hidden="true">
          <div className="skeleton h-[70px] rounded-md" />
          <div className="skeleton h-[70px] rounded-md" />
          <div className="skeleton h-[70px] rounded-md" />
          <div className="skeleton h-11 rounded-md" />
        </div>
      </AuthTicket>
    </div>
  );
}

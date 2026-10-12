import { AuthTicket } from "@/components/auth-ticket";

/** Forgot-password skeleton — the real ticket with placeholder fields, so
 *  nothing shifts when the form arrives. */
export default function Loading() {
  return (
    <div aria-busy="true">
      <p className="sr-only" role="status">
        Loading…
      </p>
      <AuthTicket
        label="Reset"
        title="Reset your password"
        description="Enter your email and we will send you a link to set a new one."
      >
        <div className="flex flex-col gap-4" aria-hidden="true">
          <div className="skeleton h-[70px] rounded-md" />
          <div className="skeleton h-11 rounded-md" />
        </div>
      </AuthTicket>
    </div>
  );
}

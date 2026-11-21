import { AuthTicket } from "@/components/auth-ticket";
import { ControlSkeleton, FieldSkeleton } from "@/components/ui/skeleton";

/** Forgot-password skeleton — the real collage ticket, with the email field,
 *  the submit and the "Remembered it? Log in" line as placeholders. */
export default function Loading() {
  return (
    <div aria-busy="true">
      <p className="sr-only" role="status">
        Loading password reset…
      </p>
      <div aria-hidden="true">
        <AuthTicket collage label="Reset" title="Reset your password">
          <div className="flex flex-col gap-4">
            <FieldSkeleton />
            <ControlSkeleton className="mt-1" />
            <div className="skeleton mx-auto h-[1lh] w-40 rounded-sm text-sm" />
          </div>
        </AuthTicket>
      </div>
    </div>
  );
}

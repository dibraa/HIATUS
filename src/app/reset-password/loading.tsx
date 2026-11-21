import { AuthTicket } from "@/components/auth-ticket";
import { ControlSkeleton, FieldSkeleton } from "@/components/ui/skeleton";

/** Reset-password skeleton — the real collage ticket, with the new password
 *  (and its hint), the confirmation and the submit as placeholders. */
export default function Loading() {
  return (
    <div aria-busy="true">
      <p className="sr-only" role="status">
        Loading new password form…
      </p>
      <div aria-hidden="true">
        <AuthTicket collage label="New password" title="Set a new password">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <FieldSkeleton />
              <div className="skeleton h-[1lh] w-36 rounded-sm text-xs" />
            </div>
            <FieldSkeleton />
            <ControlSkeleton className="mt-1" />
          </div>
        </AuthTicket>
      </div>
    </div>
  );
}

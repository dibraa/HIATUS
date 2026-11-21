import { AuthTicket } from "@/components/auth-ticket";
import { ControlSkeleton, FieldSkeleton } from "@/components/ui/skeleton";

/** Login skeleton — the real collage ticket, with the form's two fields, the
 *  "Forgot your password?" line, the submit and the footer as placeholders. */
export default function Loading() {
  return (
    <div aria-busy="true">
      <p className="sr-only" role="status">
        Loading log in…
      </p>
      <div aria-hidden="true">
        <AuthTicket
          collage
          label="Log in"
          title="Welcome back."
          footer={<div className="skeleton h-[1lh] w-48 rounded-sm" />}
        >
          <div className="flex flex-col gap-4">
            <FieldSkeleton />
            <FieldSkeleton />
            {/* Same 44px target with -my-2 as the real TextLink. */}
            <div className="-my-2 flex min-h-11 items-center self-start">
              <div className="skeleton h-[1lh] w-40 rounded-sm text-sm" />
            </div>
            <ControlSkeleton className="mt-1" />
          </div>
        </AuthTicket>
      </div>
    </div>
  );
}

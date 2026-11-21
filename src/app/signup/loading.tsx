import { AuthTicket } from "@/components/auth-ticket";
import { ControlSkeleton, FieldSkeleton } from "@/components/ui/skeleton";

/** Signup skeleton — the real collage ticket, with the four fields (phone and
 *  password carry a hint line), the submit and the footer as placeholders. */
export default function Loading() {
  return (
    <div aria-busy="true">
      <p className="sr-only" role="status">
        Loading sign-up form…
      </p>
      <div aria-hidden="true">
        <AuthTicket
          collage
          label="Sign up"
          title="Create your account"
          footer={<div className="skeleton h-[1lh] w-56 rounded-sm" />}
        >
          <div className="flex flex-col gap-4">
            <FieldSkeleton />
            <FieldSkeleton />
            <div className="flex flex-col gap-1.5">
              <FieldSkeleton />
              <div className="skeleton h-[1lh] w-16 rounded-sm text-xs" />
            </div>
            <div className="flex flex-col gap-1.5">
              <FieldSkeleton />
              <div className="skeleton h-[1lh] w-36 rounded-sm text-xs" />
            </div>
            <ControlSkeleton className="mt-1" />
          </div>
        </AuthTicket>
      </div>
    </div>
  );
}

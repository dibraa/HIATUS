import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { CheckerBand } from "@/components/ui/checker";
import { StarRating } from "@/components/star-rating";
import { formatDate } from "@/lib/format";
import { ROLE_LABELS } from "@/lib/roles";
import type { NotificationPreferences, Rating } from "@/types/database";
import { ProfileForm } from "./profile-form";
import { NotificationForm } from "./notification-form";

export const metadata: Metadata = { title: "Profile" };

export const dynamic = "force-dynamic";

type ReviewRow = Rating & {
  menu_items: { name: string } | null;
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const user = await getCurrentUser();

  const [{ data: prefs }, { data: reviews }] = await Promise.all([
    supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", user!.id)
      // maybeSingle, not single: a customer who has never opened this screen
      // has no row, and that is not an error.
      .maybeSingle<NotificationPreferences>(),
    supabase
      .from("ratings")
      .select("*, menu_items(name)")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(10)
      .returns<ReviewRow[]>(),
  ]);

  const myReviews = reviews ?? [];

  return (
    <div className="mx-auto max-w-lg py-2">
      <PageHeader
        title="Your account"
        description="How the shop identifies your order at the counter, and what we tell you about."
      />

      {/* Staff and admins see their role here — it is the only place in the
          customer-facing app that says what account they are signed in with,
          which matters when someone has both a work and a personal login. */}
      {user && user.role !== "customer" && (
        <p className="mb-6 flex flex-wrap items-center gap-2 rounded-lg border border-line bg-raised px-4 py-3 text-sm text-ink-soft">
          <Badge tone={user.role === "admin" ? "accent" : "green"}>
            {ROLE_LABELS[user.role]}
          </Badge>
          You are signed in with a team account.
          <Link
            href={user.role === "admin" ? "/admin" : "/staff"}
            className="font-medium text-accent-ink underline underline-offset-4 transition-colors duration-150 ease-hi hover:text-ink"
          >
            Go to your dashboard
          </Link>
        </p>
      )}

      <div className="flex flex-col gap-10">
        <section aria-labelledby="details-heading">
          <h2
            id="details-heading"
            className="mb-4 text-xl font-semibold tracking-tight text-ink"
          >
            Your details
          </h2>
          {user?.profile && (
            <ProfileForm profile={user.profile} email={user.email} />
          )}
        </section>

        <CheckerBand size="sm" className="h-1.5 opacity-70" />

        <section aria-labelledby="notifications-heading">
          <h2
            id="notifications-heading"
            className="mb-4 text-xl font-semibold tracking-tight text-ink"
          >
            Notifications
          </h2>
          <NotificationForm prefs={prefs ?? null} />
        </section>

        {myReviews.length > 0 && (
          <>
            <CheckerBand size="sm" className="h-1.5 opacity-70" />

            <section aria-labelledby="reviews-heading">
              <h2
                id="reviews-heading"
                className="mb-1 text-xl font-semibold tracking-tight text-ink"
              >
                Your reviews
              </h2>
              <p className="mb-4 text-sm text-muted">
                What you have rated. These appear on the drink&rsquo;s page for
                other customers.
              </p>

              <ul className="flex flex-col gap-3">
                {myReviews.map((review) => (
                  <li
                    key={review.id}
                    className="rounded-lg border border-line bg-card p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Link
                        href={`/menu/${review.menu_item_id}`}
                        className="text-sm font-semibold text-ink underline-offset-4 hover:underline"
                      >
                        {review.menu_items?.name ?? "A drink"}
                      </Link>
                      <time
                        dateTime={review.created_at}
                        className="text-xs text-muted"
                      >
                        {formatDate(review.created_at)}
                      </time>
                    </div>

                    <div className="mt-2">
                      <StarRating value={review.rating} readOnly size="sm" />
                    </div>

                    {review.comment && (
                      <p className="mt-2 max-w-[60ch] text-sm text-ink-soft">
                        &ldquo;{review.comment}&rdquo;
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

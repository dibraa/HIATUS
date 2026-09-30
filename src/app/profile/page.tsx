import type { Metadata } from "next";
import Link from "next/link";
import { getServerToken } from "@/lib/server-token";
import { apiJson } from "@/lib/api-client";
import { getCurrentUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Hairline } from "@/components/ui/hairline";
import { StarRating } from "@/components/star-rating";
import { DataError } from "@/components/ui/data-error";
import { formatDate } from "@/lib/format";
import { ROLE_LABELS } from "@/lib/roles";
import type { NotificationPreferences, Rating } from "@/types/database";
import { ProfileForm } from "./profile-form";
import { NotificationForm } from "./notification-form";

export const metadata: Metadata = { title: "Profile" };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const token = await getServerToken();
  const user = await getCurrentUser();

  let prefs: NotificationPreferences | null;
  let reviewsRaw: (Rating & { _id: string; menu_item_id: { _id: string; name: string } | string })[];
  try {
    [prefs, reviewsRaw] = await Promise.all([
      apiJson<NotificationPreferences>("/account/notifications", { token: token ?? undefined }),
      apiJson<(Rating & { _id: string; menu_item_id: { _id: string; name: string } | string })[]>(
        "/account/ratings", { token: token ?? undefined }
      ),
    ]);
  } catch {
    return (
      <div className="mx-auto max-w-6xl py-2">
        <PageHeader title="Your account" />
        <DataError
          title="Couldn't load profile"
          body="Check your connection and try again."
        />
      </div>
    );
  }

  const myReviews = reviewsRaw.map((r) => ({
    ...r,
    id: r._id ?? r.id,
    menu_items: typeof r.menu_item_id === "object" && r.menu_item_id !== null
      ? { name: (r.menu_item_id as { name: string }).name }
      : null,
    menu_item_id: typeof r.menu_item_id === "object" && r.menu_item_id !== null
      ? (r.menu_item_id as { _id: string })._id
      : r.menu_item_id as string,
  }));

  return (
    <div className="mx-auto max-w-6xl py-2">
      <PageHeader title="Your account" />

      {user && user.role !== "customer" && (
        <p className="mb-6 flex flex-wrap items-center gap-2 rounded-lg border border-line bg-raised px-4 py-3 text-sm text-ink-soft">
          <Badge tone={user.role === "admin" ? "accent" : "green"}>{ROLE_LABELS[user.role]}</Badge>
          You are signed in with a team account.
          <Link href={user.role === "admin" ? "/admin" : "/staff"} className="font-medium text-accent-ink underline underline-offset-4 transition-colors hover:text-ink">
            Go to your dashboard
          </Link>
        </p>
      )}

      <div className="grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-16">
        <section aria-labelledby="details-heading">
          <h2 id="details-heading" className="mb-4 display text-xl text-ink">Your details</h2>
          {user?.profile && <ProfileForm profile={user.profile} email={user.email} />}
        </section>

        <section aria-labelledby="notifications-heading">
          <h2 id="notifications-heading" className="mb-4 display text-xl text-ink">Notifications</h2>
          <NotificationForm prefs={prefs ?? null} />
        </section>
      </div>

      {myReviews.length > 0 && (
        <>
          <Hairline />
          <section aria-labelledby="reviews-heading">
            <h2 id="reviews-heading" className="mb-1 display text-xl text-ink">Your reviews</h2>
            <ul className="flex flex-col gap-3">
              {myReviews.map((review) => (
                <li key={review.id} className="rounded-lg border border-line bg-card p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link href={`/menu/${review.menu_item_id}`} className="text-sm font-semibold text-ink underline-offset-4 hover:underline">
                      {review.menu_items?.name ?? "A drink"}
                    </Link>
                    <time dateTime={review.created_at} className="text-xs text-muted">{formatDate(review.created_at)}</time>
                  </div>
                  <div className="mt-2"><StarRating value={review.rating} readOnly size="sm" /></div>
                  {review.comment && <p className="mt-2 max-w-[60ch] text-sm text-ink-soft">&ldquo;{review.comment}&rdquo;</p>}
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}

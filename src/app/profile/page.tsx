import type { Metadata } from "next";
import Link from "next/link";
import { getServerToken } from "@/lib/server-token";
import { apiJson } from "@/lib/api-client";
import { getCurrentUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { AccountWorkspace } from "./account-workspace";
import { ReviewPagination } from "./review-pagination";
import { StarRating } from "@/components/star-rating";
import { DataError } from "@/components/ui/data-error";
import { formatDate } from "@/lib/format";
import { ROLE_LABELS } from "@/lib/roles";
import type { NotificationPreferences, Rating } from "@/types/database";
import { ProfileForm } from "./profile-form";
import { NotificationForm } from "./notification-form";

export const metadata: Metadata = { title: "Account" };
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
    <AccountWorkspace
      name={user?.profile?.full_name ?? ""}
      email={user?.email ?? ""}
      shortcut={user && user.role !== "customer" ? (
        <p className="mb-6 flex flex-wrap items-center gap-2 rounded-lg border border-line bg-raised px-4 py-3 text-sm text-ink-soft">
          <Badge tone={user.role === "admin" ? "accent" : "green"}>{ROLE_LABELS[user.role]}</Badge>
          <Link href={user.role === "admin" ? "/admin" : "/staff"} className="font-medium text-accent-ink underline underline-offset-4 transition-colors hover:text-ink">Go to your dashboard</Link>
        </p>
      ) : null}
      details={user?.profile ? <div className="max-w-xl"><ProfileForm profile={user.profile} email={user.email} /></div> : null}
      notifications={<div className="max-w-xl"><NotificationForm prefs={prefs ?? null} /></div>}
      reviews={myReviews.length ? (
        <ReviewPagination items={myReviews.map(review => (
            <li key={review.id} className="py-5 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <Link href={"/menu/" + review.menu_item_id} className="min-w-0 break-words text-sm font-semibold text-ink underline-offset-4 hover:underline">{review.menu_items?.name ?? "A drink"}</Link>
                <time dateTime={review.created_at} className="shrink-0 text-xs text-muted">{formatDate(review.created_at)}</time>
              </div>
              <div className="mt-2"><StarRating value={review.rating} readOnly size="sm" /></div>
              {review.comment && <p className="mt-3 max-w-[60ch] break-words text-sm text-ink-soft">&ldquo;{review.comment}&rdquo;</p>}
            </li>
          ))} />
      ) : (
        <div className="py-4"><p className="mb-5 text-sm text-muted">No reviews yet.</p><ButtonLink href="/menu" variant="outline">Browse menu</ButtonLink></div>
      )}
    />
  );
}

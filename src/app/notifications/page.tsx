import type { Metadata } from "next";
import { getServerToken } from "@/lib/server-token";
import { apiJson } from "@/lib/api-client";
import { PageHeader } from "@/components/ui/page-header";
import { DataError } from "@/components/ui/data-error";
import { NotificationList } from "@/components/notification-list";
import { ButtonLink } from "@/components/ui/button";
import type { OrderNotification } from "@/types/database";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const token = await getServerToken();
  const user = await getCurrentUser();
  let notifications: OrderNotification[] | null = null;

  try {
    notifications = await apiJson<OrderNotification[]>("/account/notification-feed", {
      token: token ?? undefined,
    });
  } catch {
    return (
      <div className="mx-auto max-w-2xl py-2">
        <PageHeader title="Notifications"  />
        <DataError title="Couldn't load notifications" body="Check your connection and try again." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl py-2">
      <div className="mb-6">
        <ButtonLink href="/orders" variant="outline" size="sm">
          <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
            <path d="M10 3L5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to orders
        </ButtonLink>
      </div>
      <PageHeader
        title="Notifications"

      />
      <NotificationList notifications={notifications} accountId={user?.id ?? ""} />
    </div>
  );
}

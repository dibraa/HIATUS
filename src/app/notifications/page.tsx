import Link from "next/link";
import type { Metadata } from "next";
import { getServerToken } from "@/lib/server-token";
import { apiJson } from "@/lib/api-client";
import { PageHeader } from "@/components/ui/page-header";
import { DataError } from "@/components/ui/data-error";
import { NotificationList } from "@/components/notification-list";
import type { OrderNotification } from "@/types/database";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const token = await getServerToken();
  let notifications: OrderNotification[] | null = null;

  try {
    notifications = await apiJson<OrderNotification[]>("/account/notification-feed", {
      token: token ?? undefined,
    });
  } catch {
    return (
      <div className="mx-auto max-w-2xl py-2">
        <PageHeader title="Notifications" description="Stay up to date with your Hiatus Coffee orders." />
        <DataError title="Couldn't load notifications" body="Check your connection and try again." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl py-2">
      <div className="mb-6">
        <Link href="/orders" className="ui-caps text-2xs text-muted hover:text-ink">
          ← Back to orders
        </Link>
      </div>
      <PageHeader
        title="Notifications"
        description="Stay up to date with your Hiatus Coffee orders."
      />
      <NotificationList notifications={notifications} />
    </div>
  );
}

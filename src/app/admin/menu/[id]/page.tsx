import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getServerToken } from "@/lib/server-token";
import { apiJson } from "@/lib/api-client";
import { AdminPageHeader as PageHeader } from "@/components/admin-page-header";
import type { MenuItem } from "@/types/database";
import { MenuItemForm } from "../menu-item-form";

export const metadata: Metadata = { title: "Edit menu item" };

export default async function EditMenuItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = await getServerToken();
  const raw = await apiJson<(MenuItem & { _id: string }) | null>(`/menu/${id}`, { token: token ?? undefined }).catch(() => null);
  if (!raw) notFound();
  const item: MenuItem = { ...raw, id: raw._id ?? raw.id };

  return (
    <div className="admin-menu-editor">
      <PageHeader title={"Edit " + item.name} />
      <MenuItemForm item={item} />
    </div>
  );
}

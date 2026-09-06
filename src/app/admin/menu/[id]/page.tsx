import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import type { MenuItem } from "@/types/database";
import { MenuItemForm } from "../menu-item-form";

export const metadata: Metadata = { title: "Edit menu item" };

export default async function EditMenuItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: item } = await supabase
    .from("menu_items")
    .select("*")
    .eq("id", id)
    .single<MenuItem>();

  if (!item) notFound();

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title={"Edit " + item.name}
      />
      <MenuItemForm item={item} />
    </div>
  );
}

import type { Metadata } from "next";
import { AdminPageHeader as PageHeader } from "@/components/admin-page-header";
import { MenuItemForm } from "../menu-item-form";

export const metadata: Metadata = { title: "Add menu item" };

export default function NewMenuItemPage() {
  return (
    <div className="admin-menu-editor">
      <PageHeader
        title="Add menu item"
      />
      <MenuItemForm />
    </div>
  );
}

import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { MenuItemForm } from "../menu-item-form";

export const metadata: Metadata = { title: "Add menu item" };

export default function NewMenuItemPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Add menu item"
      />
      <MenuItemForm />
    </div>
  );
}

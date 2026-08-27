import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { MenuItemForm } from "../menu-item-form";

export const metadata: Metadata = { title: "Add menu item" };

export default function NewMenuItemPage() {
  return (
    <div className="mx-auto max-w-md">
      <PageHeader
        title="Add menu item"
        description="The price you set is the medium; small and large are derived from it."
      />
      <MenuItemForm />
    </div>
  );
}

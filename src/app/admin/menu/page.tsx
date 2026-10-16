import Link from "next/link";
import type { Metadata } from "next";
import { getServerToken } from "@/lib/server-token";
import { apiJson } from "@/lib/api-client";
import { AdminPageHeader as PageHeader } from "@/components/admin-page-header";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { DataError } from "@/components/ui/data-error";
import { ProductImage } from "@/components/ui/product-image";
import { formatPrice } from "@/lib/format";
import type { MenuItem } from "@/types/database";
import { DeleteButton } from "./delete-button";

export const metadata: Metadata = { title: "Menu items" };

export default async function AdminMenuPage() {
  const token = await getServerToken();

  let raw: (MenuItem & { _id: string })[];
  try {
    raw = await apiJson<(MenuItem & { _id: string })[]>("/menu", { token: token ?? undefined });
  } catch {
    return (
      <div>
        <PageHeader
          title="Menu items"
          description="Every drink the storefront can sell. Flavour drives both the customer filter and the best-seller report."
          action={<ButtonLink href="/admin/menu/new" size="md">Add item</ButtonLink>}
        />
        <DataError
          title="Couldn't load menu"
          body="Check your connection and try again."
        />
      </div>
    );
  }

  const menuItems = raw.map((m) => ({ ...m, id: m._id ?? m.id })).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div>
      <PageHeader
        title="Menu items"
        description="Every drink the storefront can sell. Flavour drives both the customer filter and the best-seller report."
        action={<ButtonLink href="/admin/menu/new" size="md">Add item</ButtonLink>}
      />

      {menuItems.length === 0 ? (
        <EmptyState
          title="No menu items yet"
          body="Once the shop adds drinks to the menu, they will be listed here."
          action={<ButtonLink href="/admin/menu/new">Add the first item</ButtonLink>}
        />
      ) : (
        <ul className="admin-menu-list" aria-label="Menu items">
          {menuItems.map((item) => (
            <li key={item.id} className="admin-menu-row">
              <div className="w-14 shrink-0">
                <ProductImage src={item.image_url} alt="" sizes="56px" rounded="rounded-md" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-medium text-ink">{item.name}</span>
                </p>
                <p className="admin-menu-flavor">{item.flavor}</p>
              </div>
              <p className="admin-menu-availability"><span data-available={item.is_available}>{item.is_available ? "Available" : "Sold out"}</span></p>
              <p className="admin-menu-price">{formatPrice(item.price)} <small>Medium</small></p>
              <div className="admin-menu-actions">
                <Link href={"/admin/menu/" + item.id} className="text-sm font-medium text-accent-ink underline underline-offset-4 transition-colors hover:text-ink">
                  Edit<span className="sr-only"> {item.name}</span>
                </Link>
                <DeleteButton id={item.id} name={item.name} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

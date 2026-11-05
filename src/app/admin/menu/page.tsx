import type { Metadata } from "next";
import { getServerToken } from "@/lib/server-token";
import { apiJson } from "@/lib/api-client";
import { AdminPageHeader as PageHeader } from "@/components/admin-page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { DataError } from "@/components/ui/data-error";
import { ProductImage } from "@/components/ui/product-image";
import { formatPrice } from "@/lib/format";
import type { MenuItem } from "@/types/database";
import { DeleteButton } from "./delete-button";
import { FormSuccess } from "@/components/ui/field";
import { AdminPagination } from "@/components/admin-pagination";
import type { AdminSearch } from "@/lib/activity";
import { AddMenuItemButton } from "./add-menu-item-button";
import { CategoryManager, EditMenuItemButton, ItemToggles, type Category } from "./menu-management";
import { MenuFilters } from "./menu-filters";

export const metadata: Metadata = { title: "Menu items" };
export const dynamic = "force-dynamic";

export default async function AdminMenuPage({ searchParams }: { searchParams: Promise<AdminSearch> }) {
  const token = await getServerToken();
  const search = await searchParams;
  const query = new URLSearchParams({ paginated: "true" });
  for (const key of ["search", "category", "available", "page"]) if (typeof search[key] === "string" && search[key]) query.set(key, search[key]);

  let result: { items: (MenuItem & { _id: string })[]; total: number; page: number; page_size: number };
  try {
    result = await apiJson<typeof result>(`/menu?${query}`, { token: token ?? undefined, cache: "no-store" });
  } catch {
    return (
      <div>
        <PageHeader
          title="Menu items"

          action={<AddMenuItemButton />}
        />
        <DataError
          title="Couldn't load menu"
          body="Check your connection and try again."
        />
      </div>
    );
  }

  const menuItems = result.items.map((m) => ({ ...m, id: m._id ?? m.id }));
  let categories: Category[] = [];
  let categoriesError = false;
  try { categories = await apiJson<Category[]>("/menu/categories", { cache: "no-store" }); }
  catch { categoriesError = true; }

  return (
    <div>
      <PageHeader
        title="Menu items"
        action={
          <div className="flex flex-wrap gap-2">
            <AddMenuItemButton />
            {!categoriesError && <CategoryManager categories={categories} />}
          </div>
        }
      />

      {search.saved === "1" && <div className="mb-4"><FormSuccess>Menu item saved.</FormSuccess></div>}
      <MenuFilters categories={categories} values={{ search: query.get("search") || "", category: query.get("category") || "", available: query.get("available") || "" }} />

      {categoriesError && <p role="alert" className="mb-5 text-danger">Categories could not load. Reload to try again.</p>}
      {menuItems.length === 0 ? (
        <EmptyState
          title="No menu items found"
          body="Add an item or reset your filters to see other drinks."
          action={<AddMenuItemButton>Add the first item</AddMenuItemButton>}
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
                <p className="mt-1 text-xs text-muted">{item.category}</p>
                {item.description && <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{item.description}</p>}
              </div>
              <p className="admin-menu-availability"><span data-available={item.is_available}>{item.is_available ? "Available" : "Sold out"}</span></p>
              <p className="admin-menu-price">{formatPrice(item.price)} <small>Medium</small></p>
              <div className="admin-menu-actions">
                <ItemToggles item={item} />
                <EditMenuItemButton item={item} />
                <DeleteButton id={item.id} name={item.name} />
              </div>
            </li>
          ))}
        </ul>
      )}
      <AdminPagination path="/admin/menu" query={query} page={result.page} pageSize={result.page_size} total={result.total} />
    </div>
  );
}

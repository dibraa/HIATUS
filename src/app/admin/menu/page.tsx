import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { ButtonLink } from "@/components/ui/button";
import { ProductImage } from "@/components/ui/product-image";
import { formatPrice } from "@/lib/format";
import type { MenuItem } from "@/types/database";
import { DeleteButton } from "./delete-button";

export const metadata: Metadata = { title: "Menu items" };

export default async function AdminMenuPage() {
  const supabase = await createClient();
  const { data: items } = await supabase
    .from("menu_items")
    .select("*")
    .order("name")
    .returns<MenuItem[]>();

  const menuItems = items ?? [];

  return (
    <div>
      <PageHeader
        title="Menu items"
        description="Every drink the storefront can sell. Flavour drives both the customer filter and the best-seller report."
        action={
          <ButtonLink href="/admin/menu/new" size="md">
            Add item
          </ButtonLink>
        }
      />

      {menuItems.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line-strong bg-card px-6 py-12 text-center">
          <p className="text-sm text-muted">
            No menu items yet. The storefront will show an empty menu until one is added.
          </p>
          <div className="mt-5 flex justify-center">
            <ButtonLink href="/admin/menu/new">Add the first item</ButtonLink>
          </div>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {menuItems.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-4 rounded-lg border border-line bg-card p-3"
            >
              <div className="w-14 shrink-0">
                <ProductImage
                  src={item.image_url}
                  alt=""
                  sizes="56px"
                  rounded="rounded-md"
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="font-medium text-ink">{item.name}</span>
                  {!item.is_available && (
                    <span className="rounded-full border border-line-strong px-2 py-0.5 text-2xs font-medium uppercase tracking-wide text-muted">
                      Sold out
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-xs uppercase tracking-wide text-accent">{item.flavor}</p>
                <p className="mt-0.5 text-sm tabular-nums text-muted">
                  {formatPrice(item.price)}{" "}
                  <span className="text-xs">(medium)</span>
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-4">
                <Link
                  href={"/admin/menu/" + item.id}
                  className="text-sm font-medium text-accent underline underline-offset-4 transition-colors duration-150 ease-hi hover:text-accent-hover"
                >
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

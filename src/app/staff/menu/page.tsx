import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductImage } from "@/components/ui/product-image";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/format";
import type { MenuItem } from "@/types/database";
import { AvailabilityToggle } from "./availability-toggle";

export const metadata: Metadata = { title: "Availability" };

export const dynamic = "force-dynamic";

/**
 * The counter's view of the menu: read-only except for one switch.
 *
 * Staff can take a drink off the menu when the oat milk runs out, and that is
 * all. Prices, names and photos are the owner's to change. The restriction is
 * enforced in `set_item_availability` (a security-definer RPC), not here —
 * this page just does not offer what it cannot do, so nobody discovers the
 * limit by hitting an error.
 *
 * Grouped by category so a barista scanning for "the pastries" finds them
 * together rather than reading an alphabetical list of everything.
 */
export default async function StaffMenuPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("menu_items")
    .select("*")
    .order("category")
    .order("name")
    .returns<MenuItem[]>();

  const items = data ?? [];
  const soldOut = items.filter((i) => !i.is_available).length;

  const byCategory = new Map<string, MenuItem[]>();
  for (const item of items) {
    const key = item.category || "Other";
    const bucket = byCategory.get(key);
    if (bucket) bucket.push(item);
    else byCategory.set(key, [item]);
  }

  return (
    <div>
      <PageHeader
        title="Availability"
        description="Flip a drink off when you run out. Customers see the change straight away and cannot add it to a cart."
      />

      {items.length === 0 ? (
        <EmptyState
          title="No menu items yet"
          body="Once the shop adds drinks to the menu, they will be listed here."
        />
      ) : (
        <>
          <p className="mb-5 text-sm text-muted" aria-live="polite">
            {soldOut === 0
              ? `All ${items.length} items are available.`
              : `${soldOut} of ${items.length} ${soldOut === 1 ? "item is" : "items are"} sold out.`}
          </p>

          <div className="flex flex-col gap-8">
            {[...byCategory.entries()].map(([category, group]) => {
              const headingId = `cat-${category.replace(/\s+/g, "-").toLowerCase()}`;

              return (
                <section key={category} aria-labelledby={headingId}>
                  <h2
                    id={headingId}
                    className="mb-3 eyebrow text-muted"
                  >
                    {category}
                  </h2>

                  <ul className="flex flex-col gap-2">
                    {group.map((item) => (
                      <li
                        key={item.id}
                        className={`flex items-center gap-3 rounded-lg border bg-card p-3 ${
                          item.is_available ? "border-line" : "border-danger/30"
                        }`}
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
                          <p className="truncate text-sm font-semibold text-ink">
                            {item.name}
                          </p>
                          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted">
                            <span>{item.flavor}</span>
                            <span aria-hidden="true">&middot;</span>
                            <span className="numeric">{formatPrice(item.price)}</span>
                          </p>
                        </div>

                        <div className="shrink-0">
                          <AvailabilityToggle
                            itemId={item.id}
                            itemName={item.name}
                            available={item.is_available}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>

          <p className="mt-8 flex flex-wrap items-center gap-2 text-xs text-muted">
            <Badge tone="neutral">Read only</Badge>
            Prices, names and photos are managed by an admin on the menu screen.
          </p>
        </>
      )}
    </div>
  );
}

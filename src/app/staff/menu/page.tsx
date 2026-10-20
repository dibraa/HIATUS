import type { Metadata } from "next";
import { getServerToken } from "@/lib/server-token";
import { apiJson } from "@/lib/api-client";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductImage } from "@/components/ui/product-image";
import { DataError } from "@/components/ui/data-error";
import { formatPrice } from "@/lib/format";
import type { MenuItem } from "@/types/database";
import { AvailabilityRow } from "./availability-toggle";
import { StaffPageHeading } from "../staff-page-heading";

export const metadata: Metadata = { title: "Availability" };
export const dynamic = "force-dynamic";

export default async function StaffMenuPage() {
  const token = await getServerToken();
  const raw = await apiJson<(MenuItem & { _id: string })[]>("/menu", {
    token: token ?? undefined,
  }).catch(() => null);
  if (raw === null)
    return (
      <div>
        <StaffPageHeading title="Availability" />
        <div className="pt-4">
          <DataError
            title="Couldn't load availability"
            body="Check your connection before changing stock availability."
            showRetry
          />
        </div>
      </div>
    );
  const items = (raw ?? [])
    .map((m) => ({ ...m, id: m._id ?? m.id }))
    .sort(
      (a, b) =>
        a.category.localeCompare(b.category) || a.name.localeCompare(b.name),
    );

  const soldOut = items.filter((i) => !i.is_available).length;
  const byCategory = new Map<string, typeof items>();
  for (const item of items) {
    const key = item.category || "Other";
    const bucket = byCategory.get(key);
    if (bucket) bucket.push(item);
    else byCategory.set(key, [item]);
  }

  return (
    <div>
      <StaffPageHeading title="Availability" />
      {/* Full width (live choice): the list uses the whole content column. */}
      <div className="grid gap-5 pt-4">
        <div className="grid gap-1">
          <p className="staff-lead">
            Flip a drink off when you run out. Customers see the change
            straight away.
          </p>
          {items.length > 0 && (
            <p className="staff-lead" aria-live="polite">
              {soldOut === 0
                ? `All ${items.length} items are available.`
                : `${soldOut} of ${items.length} ${soldOut === 1 ? "item is" : "items are"} sold out.`}
            </p>
          )}
        </div>

        {items.length === 0 ? (
          <EmptyState
            title="No menu items yet"
            body="Once the shop adds drinks to the menu, they will be listed here."
          />
        ) : (
          <>
            <div className="grid gap-6">
              {[...byCategory.entries()].map(([category, group]) => {
                const headingId = `cat-${category.replace(/s+/g, "-").toLowerCase()}`;
                const availableCount = group.filter((i) => i.is_available).length;
                return (
                  <section key={category} aria-labelledby={headingId}>
                    <div className="mb-2 flex items-baseline justify-between">
                      <h2 id={headingId} className="display staff-section-title">
                        {category}
                      </h2>
                      <span className="staff-caption">
                        {availableCount} of {group.length}
                      </span>
                    </div>
                    <ul className="grid gap-2">
                      {group.map((item) => (
                        <li key={item.id}>
                          {/* The row is a <label>, so its text is spans rather
                              than paragraphs. */}
                          <AvailabilityRow
                            itemId={item.id}
                            itemName={item.name}
                            available={item.is_available}
                          >
                            <span
                              className={`block w-14 shrink-0 ${!item.is_available ? "opacity-40 grayscale" : ""}`}
                            >
                              <ProductImage
                                src={item.image_url}
                                alt=""
                                sizes="56px"
                                rounded="rounded-md"
                              />
                            </span>
                            <span className="block min-w-0 flex-1">
                              <span
                                className={`block truncate text-sm font-semibold ${item.is_available ? "text-ink" : "text-muted line-through"}`}
                              >
                                {item.name}
                              </span>
                              <span className="staff-caption mt-0.5 flex flex-wrap items-center gap-x-2">
                                <span>{item.flavor}</span>
                                <span aria-hidden="true">&middot;</span>
                                <span className="numeric">
                                  {formatPrice(item.price)}
                                </span>
                              </span>
                            </span>
                          </AvailabilityRow>
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
            <p className="staff-caption flex flex-wrap items-center gap-2">
              <span className="counter-tag">Read only</span>
              Prices, names and photos are managed by an admin on the menu
              screen.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

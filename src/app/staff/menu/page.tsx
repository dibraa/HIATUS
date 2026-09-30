import type { Metadata } from "next";
import { getServerToken } from "@/lib/server-token";
import { apiJson } from "@/lib/api-client";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductImage } from "@/components/ui/product-image";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/format";
import type { MenuItem } from "@/types/database";
import { AvailabilityToggle } from "./availability-toggle";

export const metadata: Metadata = { title: "Availability" };
export const dynamic = "force-dynamic";

export default async function StaffMenuPage() {
  const token = await getServerToken();
  const raw = await apiJson<(MenuItem & { _id: string })[]>("/menu", { token: token ?? undefined }).catch(() => null);
  const items = (raw ?? [])
    .map((m) => ({ ...m, id: m._id ?? m.id }))
    .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));

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
      <PageHeader size="utility" title="Availability" description="Flip a drink off when you run out. Customers see the change straight away." />

      {items.length === 0 ? (
        <EmptyState title="No menu items yet" body="Once the shop adds drinks to the menu, they will be listed here." />
      ) : (
        <>
          <p className="mb-5 text-sm text-muted" aria-live="polite">
            {soldOut === 0
              ? `All ${items.length} items are available.`
              : `${soldOut} of ${items.length} ${soldOut === 1 ? "item is" : "items are"} sold out.`}
          </p>
          <div className="flex flex-col gap-6">
            {[...byCategory.entries()].map(([category, group]) => {
              const headingId = `cat-${category.replace(/\s+/g, "-").toLowerCase()}`;
              const availableCount = group.filter((i) => i.is_available).length;
              return (
                <section key={category} aria-labelledby={headingId}>
                  <div className="mb-2 flex items-baseline justify-between">
                    <h2 id={headingId} className="display text-sm text-ink">{category}</h2>
                    <span className="text-xs text-muted">{availableCount} of {group.length}</span>
                  </div>
                  <ul className="flex flex-col gap-2">
                    {group.map((item) => (
                      <li key={item.id} className={`flex items-center gap-3 rounded-lg border bg-card p-3 transition-all ${
                        item.is_available
                          ? "border-line hover:border-line-strong hover:shadow-sm"
                          : "border-danger/30 bg-danger-soft-bg/30"
                      }`}>
                        <div className={`w-14 shrink-0 ${!item.is_available ? "opacity-40 grayscale" : ""}`}>
                          <ProductImage src={item.image_url} alt="" sizes="56px" rounded="rounded-md" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`truncate text-sm font-semibold ${item.is_available ? "text-ink" : "text-muted line-through"}`}>
                            {item.name}
                          </p>
                          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted">
                            <span>{item.flavor}</span>
                            <span aria-hidden="true">&middot;</span>
                            <span className="numeric">{formatPrice(item.price)}</span>
                          </p>
                        </div>
                        <div className="shrink-0">
                          <AvailabilityToggle itemId={item.id} itemName={item.name} available={item.is_available} />
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

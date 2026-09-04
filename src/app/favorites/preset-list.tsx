"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/format";
import { getSizeOption, priceForSize } from "@/lib/sizes";
import { deletePreset } from "@/app/actions/account";
import type { MenuItem, OrderPreset } from "@/types/database";

/**
 * Saved orders ("my usual"), re-priced at today's menu.
 *
 * A preset stores only item ids, quantities and sizes — never prices. So this
 * component resolves each line against the CURRENT menu, which means three
 * things are handled honestly rather than silently:
 *
 *   - a price change since saving shows today's price, not the old one;
 *   - a drink that has since been deleted is dropped, and said so;
 *   - a drink that is sold out today is listed but not added to the cart.
 *
 * Loading a preset fills the cart and sends the customer to it rather than
 * ordering outright: the whole point of a saved order is that it is usually
 * right, not always — and they may want to add a pastry.
 */
export function PresetList({
  presets,
  menu,
}: {
  presets: OrderPreset[];
  menu: MenuItem[];
}) {
  const { addItem, clear } = useCart();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const byId = new Map(menu.map((m) => [m.id, m]));

  function resolve(preset: OrderPreset) {
    const lines = preset.lines
      .map((line) => {
        const item = byId.get(line.menu_item_id);
        if (!item) return null;
        return {
          item,
          quantity: line.quantity,
          size: line.size,
          unitPrice: priceForSize(item.price, line.size),
        };
      })
      .filter((l): l is NonNullable<typeof l> => l !== null);

    return {
      lines,
      missing: preset.lines.length - lines.length,
      unavailable: lines.filter((l) => !l.item.is_available),
      total: lines
        .filter((l) => l.item.is_available)
        .reduce((sum, l) => sum + l.unitPrice * l.quantity, 0),
    };
  }

  function load(preset: OrderPreset) {
    const { lines } = resolve(preset);
    const buyable = lines.filter((l) => l.item.is_available);

    if (buyable.length === 0) {
      toast.error("Nothing in this preset is available right now.");
      return;
    }

    // Replaces the cart rather than appending. "Order my usual" means the
    // usual, not the usual plus whatever was left in the cart last week.
    clear();
    for (const line of buyable) {
      addItem(
        {
          menuItemId: line.item.id,
          name: line.item.name,
          flavor: line.item.flavor,
          size: line.size,
          price: line.unitPrice,
          imageUrl: line.item.image_url,
        },
        line.quantity
      );
    }

    const skipped = lines.length - buyable.length;
    toast.success(
      skipped > 0
        ? `Added ${buyable.length} of ${lines.length} — the rest are sold out.`
        : `${preset.name} is in your cart.`
    );
    router.push("/cart");
  }

  return (
    <ul className="flex flex-col gap-3">
      {presets.map((preset) => {
        const { lines, missing, unavailable, total } = resolve(preset);

        return (
          <li key={preset.id} className="rounded-lg border border-line bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-ink">{preset.name}</h3>
                <p className="mt-0.5 text-xs text-muted">
                  {lines.length} {lines.length === 1 ? "drink" : "drinks"}
                  {total > 0 && (
                    <>
                      {" · "}
                      <span className="tabular-nums">{formatPrice(total)}</span>{" "}
                      at today&rsquo;s prices
                    </>
                  )}
                </p>
              </div>

              <div className="flex shrink-0 gap-2">
                <Button size="sm" onClick={() => load(preset)} disabled={pending}>
                  Load into cart
                </Button>

                {confirmingId === preset.id ? (
                  <Button
                    size="sm"
                    variant="danger"
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        const { error } = await deletePreset(preset.id);
                        if (error) toast.error(error);
                        else toast.success("Preset removed");
                        setConfirmingId(null);
                      })
                    }
                  >
                    Confirm
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setConfirmingId(preset.id)}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </div>

            <ul className="mt-3 flex flex-col gap-1 border-t border-line pt-3 text-sm">
              {lines.map((line) => (
                <li
                  key={`${line.item.id}-${line.size}`}
                  className="flex justify-between gap-4"
                >
                  <span className="min-w-0 text-ink-soft">
                    <span className="tabular-nums text-muted">{line.quantity}&times;</span>{" "}
                    {line.item.name}{" "}
                    <span className="text-muted">
                      ({getSizeOption(line.size).label})
                    </span>
                    {!line.item.is_available && (
                      <span className="ml-1.5 text-xs font-medium text-danger">
                        sold out
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 tabular-nums text-ink">
                    {formatPrice(line.unitPrice * line.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            {(missing > 0 || unavailable.length > 0) && (
              <p className="mt-2.5 text-xs text-muted">
                {missing > 0 &&
                  `${missing} ${missing === 1 ? "drink is" : "drinks are"} no longer on the menu. `}
                {unavailable.length > 0 &&
                  `${unavailable.length} sold out today and will be skipped.`}
              </p>
            )}
          </li>
        );
      })}
    </ul>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format";
import { resolvePreset, useLoadPreset } from "@/lib/presets";
import { getSizeOption } from "@/lib/sizes";
import type { MenuItem, OrderPreset } from "@/types/database";

/**
 * "Your usual": up to two saved orders, each one tap from the cart.
 *
 * Only the FIRST gets the filled button — one primary action per view — the
 * rest are outlined. A preset whose items are all sold out today stays
 * listed but cannot be loaded, and says why.
 */
export function UsualOrders({ presets, menu }: { presets: OrderPreset[]; menu: MenuItem[] }) {
  const load = useLoadPreset(menu);
  const byId = new Map(menu.map((m) => [m.id, m]));

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {presets.map((preset, i) => {
        const { lines, total } = resolvePreset(preset, byId);
        const buyable = lines.some((l) => l.item.is_available);
        const description = lines
          .map((l) => `${l.quantity > 1 ? `${l.quantity} × ` : ""}${l.item.name} (${getSizeOption(l.size).code})`)
          .join(" · ");

        return (
          <li key={preset.id} className="flex flex-col gap-3 rounded-2xl bg-card p-4 sm:p-5">
            <div>
              <p className="eyebrow text-muted">Saved · {preset.name}</p>
              <p className="mt-1.5 text-ink">{description || "No longer on the menu"}</p>
            </div>
            <div className="mt-auto flex items-center justify-between gap-3">
              <span className="numeric text-sm text-ink-soft">{buyable ? formatPrice(total) : "Sold out today"}</span>
              <Button
                type="button"
                variant={i === 0 ? "primary" : "outline"}
                disabled={!buyable}
                onClick={() => load(preset)}
              >
                Order again
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

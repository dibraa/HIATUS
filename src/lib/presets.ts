"use client";

import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useCart } from "@/lib/cart-context";
import { priceForSize } from "@/lib/sizes";
import type { MenuItem, OrderPreset } from "@/types/database";

/**
 * A saved order ("preset") matched against the live menu: which of its lines
 * still exist, which are sold out, and what the buyable part costs today.
 * Shared by the Favorites page and the home page's "Your usual".
 */
export function resolvePreset(preset: OrderPreset, byId: Map<string, MenuItem>) {
  const lines = preset.lines
    .map((line) => {
      const item = byId.get(line.menu_item_id);
      if (!item) return null;
      return { item, quantity: line.quantity, size: line.size, unitPrice: priceForSize(item.price, line.size) };
    })
    .filter((l): l is NonNullable<typeof l> => l !== null);

  return {
    lines,
    missing: preset.lines.length - lines.length,
    unavailable: lines.filter((l) => !l.item.is_available),
    total: lines.filter((l) => l.item.is_available).reduce((sum, l) => sum + l.unitPrice * l.quantity, 0),
  };
}

/**
 * Loads a preset into the cart and goes to it. Replaces the cart rather than
 * appending: "order my usual" means the usual, not the usual plus whatever was
 * left in the cart last week.
 */
export function useLoadPreset(menu: MenuItem[]) {
  const { addItem, clear } = useCart();
  const router = useRouter();
  const byId = new Map(menu.map((m) => [m.id, m]));

  return function load(preset: OrderPreset) {
    const { lines } = resolvePreset(preset, byId);
    const buyable = lines.filter((l) => l.item.is_available);

    if (buyable.length === 0) {
      toast.error("Nothing in this preset is available right now.");
      return;
    }

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
  };
}

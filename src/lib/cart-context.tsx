"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_SIZE, isDrinkSize, type DrinkSize } from "@/lib/sizes";

export type CartLine = {
  menuItemId: string;
  name: string;
  flavor: string;
  size: DrinkSize;
  /** Unit price for THIS size (base price + size delta), not the menu base price. */
  price: number;
  imageUrl: string | null;
  quantity: number;
};

/**
 * Cart lines are keyed by item *and* size — the same drink in small and large
 * are two separate lines, so adding a large never silently bumps the small.
 */
export type LineKey = string;

export function lineKey(menuItemId: string, size: DrinkSize): LineKey {
  return `${menuItemId}__${size}`;
}

type CartContextValue = {
  lines: CartLine[];
  addItem: (item: Omit<CartLine, "quantity">, quantity?: number) => void;
  removeItem: (key: LineKey) => void;
  setQuantity: (key: LineKey, quantity: number) => void;
  clear: () => void;
  totalItems: number;
  totalPrice: number;
  /** False until localStorage has been read, so UI can show a skeleton instead of an empty cart. */
  hydrated: boolean;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "hiatus-cart";

/**
 * Normalises whatever is in localStorage into current-shape cart lines.
 * Carts saved before sizes existed have no `size` field; those become the
 * default size at their stored price rather than being thrown away.
 */
function migrateStoredLines(raw: unknown): CartLine[] {
  if (!Array.isArray(raw)) return [];

  return raw.flatMap((entry): CartLine[] => {
    if (typeof entry !== "object" || entry === null) return [];
    const line = entry as Partial<CartLine>;

    if (
      typeof line.menuItemId !== "string" ||
      typeof line.name !== "string" ||
      typeof line.price !== "number" ||
      typeof line.quantity !== "number"
    ) {
      return [];
    }

    return [
      {
        menuItemId: line.menuItemId,
        name: line.name,
        flavor: typeof line.flavor === "string" ? line.flavor : "",
        size: isDrinkSize(line.size) ? line.size : DEFAULT_SIZE,
        price: line.price,
        imageUrl: typeof line.imageUrl === "string" ? line.imageUrl : null,
        quantity: Math.max(1, Math.floor(line.quantity)),
      },
    ];
  });
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // one-time sync from localStorage (an external system) on mount, done here
    // rather than in a lazy useState initializer so the client's first render
    // matches the server-rendered (empty-cart) HTML and avoids a hydration mismatch
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setLines(migrateStoredLines(JSON.parse(raw)));
    } catch {
      // ignore malformed cart data
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, hydrated]);

  const addItem: CartContextValue["addItem"] = (item, quantity = 1) => {
    setLines((prev) => {
      const key = lineKey(item.menuItemId, item.size);
      const existing = prev.find((l) => lineKey(l.menuItemId, l.size) === key);
      if (existing) {
        return prev.map((l) =>
          lineKey(l.menuItemId, l.size) === key
            ? { ...l, quantity: l.quantity + quantity }
            : l
        );
      }
      return [...prev, { ...item, quantity }];
    });
  };

  const removeItem = (key: LineKey) => {
    setLines((prev) => prev.filter((l) => lineKey(l.menuItemId, l.size) !== key));
  };

  const setQuantity = (key: LineKey, quantity: number) => {
    if (quantity <= 0) {
      removeItem(key);
      return;
    }
    setLines((prev) =>
      prev.map((l) => (lineKey(l.menuItemId, l.size) === key ? { ...l, quantity } : l))
    );
  };

  const clear = () => setLines([]);

  const totalItems = useMemo(
    () => lines.reduce((sum, l) => sum + l.quantity, 0),
    [lines]
  );
  const totalPrice = useMemo(
    () => lines.reduce((sum, l) => sum + l.quantity * l.price, 0),
    [lines]
  );

  return (
    <CartContext.Provider
      value={{
        lines,
        addItem,
        removeItem,
        setQuantity,
        clear,
        totalItems,
        totalPrice,
        hydrated,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}

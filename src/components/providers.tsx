"use client";

import { CartProvider } from "@/lib/cart-context";
import { AppToaster } from "./app-toaster";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      {children}
      <AppToaster />
    </CartProvider>
  );
}

"use client";

import { IntegrationRuntime } from "./integration-runtime";
import { CartProvider } from "@/lib/cart-context";
import { AppToaster } from "./app-toaster";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <IntegrationRuntime />
      {children}
      <AppToaster />
    </CartProvider>
  );
}

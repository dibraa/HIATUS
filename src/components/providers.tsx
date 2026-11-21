"use client";

import { IntegrationRuntime } from "./integration-runtime";
import { CartProvider } from "@/lib/cart-context";
import { AppToaster } from "./app-toaster";
import { ClickLimit } from "./click-limit";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <IntegrationRuntime />
      <ClickLimit />
      {children}
      <AppToaster />
    </CartProvider>
  );
}

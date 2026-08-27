"use client";

import { Toaster } from "react-hot-toast";
import { CartProvider } from "@/lib/cart-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      {children}
      {/* react-hot-toast paints white by default, which is a bright card on
          a dark page. Pointing it at the tokens keeps it themed with
          everything else, in both directions, for free. */}
      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 2500,
          style: {
            background: "var(--hi-card)",
            color: "var(--hi-ink)",
            border: "1px solid var(--hi-line)",
            boxShadow: "var(--hi-shadow-md)",
            fontSize: "0.875rem",
          },
        }}
      />
    </CartProvider>
  );
}

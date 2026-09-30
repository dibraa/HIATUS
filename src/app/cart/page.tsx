import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { CartView } from "./cart-view";

export const metadata: Metadata = { title: "Your cart" };

/**
 * Server shell around the cart.
 *
 * The cart itself lives in localStorage and so must render on the client, but
 * whether someone is signed in is a server fact — and the "save this as your
 * usual" control needs it. Passing it down beats having the client re-ask.
 */
export default async function CartPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <EmptyState
        title="Log in first to view your cart"
        body="Please log in before viewing your cart."
        action={<ButtonLink href="/login?next=%2Fcart" size="lg">Log in</ButtonLink>}
      />
    );
  }

  return <CartView isLoggedIn={!!user} />;
}

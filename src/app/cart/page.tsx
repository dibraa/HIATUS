import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
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
  return <CartView isLoggedIn={!!user} />;
}

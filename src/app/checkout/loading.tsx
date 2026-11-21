import { CheckoutFormSkeleton } from "./checkout-form-skeleton";

/**
 * Checkout skeleton — the page header, then CheckoutForm's cards (shared with
 * the form's own pre-hydration placeholder).
 */
export default function Loading() {
  return (
    <div aria-busy="true">
      <p className="sr-only" role="status">
        Loading checkout…
      </p>

      <div aria-hidden="true" className="mx-auto max-w-lg py-2">
        <div className="mb-heading">
          <div className="skeleton display h-lh w-[4.3em] max-w-full rounded-md text-6xl" />
        </div>
        <CheckoutFormSkeleton />
      </div>
    </div>
  );
}

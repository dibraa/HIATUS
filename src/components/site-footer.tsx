import Link from "next/link";
import Image from "next/image";

/**
 * Site footer.
 *
 * Carries the operational facts a pickup-only shop gets asked for repeatedly
 * (how payment works, that there is no delivery) rather than filler links —
 * answering those here removes a reason to abandon the cart.
 */
export function SiteFooter() {
  const linkClass =
    "text-sm text-ink-soft transition-colors duration-150 ease-hi hover:text-ink hover:underline underline-offset-4";

  return (
    <footer className="mt-20 border-t border-line bg-card">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2.5">
              <Image src="/logo.png" alt="" width={40} height={40} className="h-9 w-9 rounded-xl bg-white object-contain ring-1 ring-line" />
              <span className="text-sm font-semibold uppercase tracking-[0.22em] text-ink">
                Hiatus
              </span>
            </div>
            {/* ~55 characters per line keeps this comfortably readable */}
            <p className="mt-4 max-w-[38ch] text-sm text-muted">
              Order ahead, skip the queue, and pick your drink up when it is ready.
            </p>
          </div>

          <nav aria-labelledby="footer-shop">
            <h2 id="footer-shop" className="text-2xs font-semibold uppercase tracking-[0.16em] text-muted">
              Shop
            </h2>
            <ul className="mt-4 flex flex-col gap-2.5">
              <li>
                <Link href="/" className={linkClass}>
                  Full menu
                </Link>
              </li>
              <li>
                <Link href="/cart" className={linkClass}>
                  Your cart
                </Link>
              </li>
            </ul>
          </nav>

          <nav aria-labelledby="footer-account">
            <h2 id="footer-account" className="text-2xs font-semibold uppercase tracking-[0.16em] text-muted">
              Account
            </h2>
            <ul className="mt-4 flex flex-col gap-2.5">
              <li>
                <Link href="/orders" className={linkClass}>
                  My orders
                </Link>
              </li>
              <li>
                <Link href="/profile" className={linkClass}>
                  Profile
                </Link>
              </li>
              <li>
                <Link href="/login" className={linkClass}>
                  Log in
                </Link>
              </li>
            </ul>
          </nav>

          <div>
            <h2 className="text-2xs font-semibold uppercase tracking-[0.16em] text-muted">
              Good to know
            </h2>
            <ul className="mt-4 flex flex-col gap-2.5 text-sm text-ink-soft">
              <li>Pickup only — no delivery yet</li>
              <li>Cash on pickup</li>
              <li>Orders can be cancelled while pending</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-line pt-6">
          <p className="text-xs text-muted">
            &copy; {new Date().getFullYear()} Hiatus Coffee. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

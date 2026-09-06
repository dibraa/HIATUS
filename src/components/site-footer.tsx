import Link from "next/link";
import { Wordmark } from "@/components/brand";

/**
 * Site footer.
 *
 * Carries the operational facts a pickup-only shop gets asked for repeatedly
 * (how payment works, that there is no delivery) rather than filler links —
 * answering those here removes a reason to abandon the cart.
 *
 * Set on the pine panel: the comp closes its page on the brand's darkest
 * surface, and it gives the footer a job other than being the pale strip
 * everything runs out into. Every colour in here is therefore an `inverse-*`
 * token — `muted` and `line` are unreadable on this ground.
 */
export function SiteFooter() {
  const linkClass =
    "ui-caps text-2xs text-inverse-muted transition-colors hover:text-inverse-fg";

  const headingClass = "eyebrow text-inverse-display";

  return (
    <footer className="mt-20 bg-inverse-bg text-inverse-fg">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Wordmark size="md" className="text-inverse-fg" />

            {/* ~55 characters per line keeps this comfortably readable */}
            <p className="mt-5 max-w-[38ch] text-sm text-inverse-muted">
              Order ahead, skip the queue, and pick your drink up when it is
              ready.
            </p>
          </div>

          <nav aria-labelledby="footer-shop">
            <h2 id="footer-shop" className={headingClass}>
              Shop
            </h2>
            <ul className="mt-5 flex flex-col gap-3">
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
            <h2 id="footer-account" className={headingClass}>
              Account
            </h2>
            <ul className="mt-5 flex flex-col gap-3">
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
            <h2 className={headingClass}>Good to know</h2>
            <ul className="mt-5 flex flex-col gap-3 text-sm text-inverse-muted">
              <li>Pickup only — no delivery yet</li>
              <li>Cash on pickup</li>
              <li>Orders can be cancelled while pending</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-inverse-line/40 pt-6">
          <p className="ui-caps text-2xs text-inverse-muted">
            &copy; {new Date().getFullYear()} Hiatus Coffee
          </p>
        </div>
      </div>
    </footer>
  );
}

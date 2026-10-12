import Link from "next/link";
import { Wordmark } from "@/components/brand";
import { getCurrentUser } from "@/lib/auth";

/**
 * Site footer: a slim two-row bar on the pine panel.
 *
 * Row one is the brand and ONE inline row of links — no column headings,
 * because four links do not need categorising, and headings over two-item
 * lists were most of what made the old four-column footer read as clutter.
 * Row two keeps the operational facts a pickup-only shop gets asked about
 * (no delivery, cash, cancelling), set as a single quiet line beside the
 * copyright rather than as a fourth column of sentences.
 *
 * Every colour is an `inverse-*` token — `muted` and `line` are unreadable on
 * this ground. Guests get the welcome page's sections and the way in; signed-in
 * customers get the places they return to.
 */
export async function SiteFooter() {
  const user = await getCurrentUser();

  const links = user
    ? [
        { href: "/menu", label: "Menu" },
        { href: "/cart", label: "Cart" },
        { href: "/orders", label: "My orders" },
        { href: "/profile", label: "Profile" },
      ]
    : [
        // The guest welcome's own sections (components/welcome).
        { href: "/#inside", label: "Look around" },
        { href: "/#visit", label: "Hours" },
        { href: "/login", label: "Log in" },
        { href: "/signup", label: "Sign up" },
      ];

  return (
    <footer className="mt-16 bg-inverse-bg text-inverse-fg">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Wordmark size="md" className="text-inverse-fg" />
            <p className="mt-2 text-sm text-inverse-muted">Take that much needed break.</p>
          </div>

          <nav aria-label="Footer">
            <ul className="flex flex-wrap gap-x-6 gap-y-2">
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="ui-caps inline-flex min-h-11 items-center text-2xs text-inverse-muted transition-colors hover:text-inverse-fg sm:min-h-0"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-6 flex flex-col gap-2 border-t border-inverse-line/40 pt-5 text-inverse-muted sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
          <p className="ui-caps text-2xs">&copy; {new Date().getFullYear()} Hiatus Coffee</p>
          {/* Body face, so a step up from the caps beside it: the 2xs size is
              tuned for tracked mono caps and is too small for a sentence. */}
          <p className="text-sm">Pickup only &middot; Cash on pickup &middot; Orders can be cancelled while pending</p>
        </div>
      </div>
    </footer>
  );
}

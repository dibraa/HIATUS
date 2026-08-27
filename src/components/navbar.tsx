import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CartBadge } from "@/components/cart-badge";
import { SignOutButton } from "@/components/sign-out-button";
import { MobileNav } from "@/components/mobile-nav";
import { SearchField } from "@/components/search-field";

/**
 * Sticky site header.
 *
 * Three zones, mirroring the reference: identity on the left, search in the
 * middle, account and cart on the right. Search sits in the header from `md`
 * up; below that the home page renders its own search so the header keeps
 * enough room for the wordmark, cart and menu trigger at 320px.
 *
 * Sticky because the cart and search are the two controls a shopper reaches for
 * repeatedly while scrolling a long menu.
 */
export async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    isAdmin = profile?.role === "admin";
  }

  const navLink =
    "text-sm font-medium text-ink-soft transition-colors duration-150 ease-hi hover:text-ink";

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:gap-4">
        {/* Identity */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5"
          aria-label="Hiatus Coffee, go to menu"
        >
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-sm font-semibold text-accent-fg"
          >
            H
          </span>
          <span className="text-sm font-semibold uppercase tracking-[0.22em] text-ink">
            Hiatus
          </span>
        </Link>

        {/* Primary nav — collapses into MobileNav below lg */}
        <nav aria-label="Main" className="hidden shrink-0 items-center gap-5 lg:flex">
          <Link href="/" className={navLink}>
            Menu
          </Link>
          {user && (
            <Link href="/orders" className={navLink}>
              My orders
            </Link>
          )}
          {isAdmin && (
            <Link href="/admin" className={navLink}>
              Admin
            </Link>
          )}
        </nav>

        {/* Search takes the slack in the middle */}
        <div className="ml-auto hidden min-w-0 flex-1 justify-center md:flex md:ml-2">
          <SearchField id="header-search" className="w-full max-w-sm" />
        </div>

        {/* Account + cart */}
        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2 md:ml-0">
          {user ? (
            <>
              <Link href="/profile" className={`hidden lg:inline ${navLink}`}>
                Profile
              </Link>
              <span className="hidden lg:inline">
                <SignOutButton />
              </span>
            </>
          ) : (
            <>
              <Link href="/login" className={`hidden lg:inline ${navLink}`}>
                Log in
              </Link>
              <Link
                href="/signup"
                className="hidden h-10 items-center rounded-full bg-accent px-4 text-sm font-medium text-accent-fg transition-colors duration-150 ease-hi hover:bg-accent-hover lg:inline-flex"
              >
                Sign up
              </Link>
            </>
          )}

          <CartBadge />
          <MobileNav isLoggedIn={!!user} isAdmin={isAdmin} />
        </div>
      </div>
    </header>
  );
}

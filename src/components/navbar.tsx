import Link from "next/link";
import Image from "next/image";
import { getCurrentUser, accessOf } from "@/lib/auth";
import { isAdmin, isStaff } from "@/lib/roles";
import { CartBadge } from "@/components/cart-badge";
import { SignOutButton } from "@/components/sign-out-button";
import { MobileNav } from "@/components/mobile-nav";
import { ThemeToggle } from "@/components/theme-toggle";

/**
 * Sticky site header.
 *
 * Identity (the logo mark) sits left, primary nav follows it from `lg` up,
 * account/cart sit right — small tracked mono caps on the bare cream, no
 * card, no shadow, just a hairline underneath.
 *
 * Search deliberately does NOT live here. It filters the menu, so it sits with
 * the menu (see `app/page.tsx`); putting it in the header cost the row the
 * space the identity and role-gated links already need at narrow widths.
 *
 * The work links are role-gated. A barista sees "Counter", an owner sees both
 * "Counter" and "Admin", and a customer sees neither — a nav link to a page
 * that will bounce you is worse than no link at all.
 */
export async function Navbar() {
  const user = await getCurrentUser();
  const access = accessOf(user);

  const staff = isStaff(access);
  const admin = isAdmin(access);

  const navLink =
    "ui-caps text-2xs text-ink-soft transition-colors hover:text-ink";

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        {/* Identity */}
        <Link
          href="/"
          aria-label="Hiatus Coffee, go to menu"
          className="flex shrink-0 items-center gap-2.5 text-ink"
        >
          <Image
            src="/logo.png"
            alt=""
            width={40}
            height={40}
            className="h-9 w-9 rounded-md bg-white object-contain ring-1 ring-line"
          />
          <span className="ui-caps hidden text-xs sm:inline">Hiatus</span>
        </Link>

        {/* Primary nav — collapses into MobileNav below lg */}
        <nav aria-label="Main" className="hidden shrink-0 items-center gap-6 lg:flex">
          <Link href="/" className={navLink}>
            Menu
          </Link>
          {user && (
            <>
              <Link href="/orders" className={navLink}>
                Orders
              </Link>
              <Link href="/favorites" className={navLink}>
                Saved
              </Link>
            </>
          )}
          {staff && (
            <Link href="/staff" className={navLink}>
              Counter
            </Link>
          )}
          {admin && (
            <Link href="/admin" className={navLink}>
              Admin
            </Link>
          )}
        </nav>

        {/* Right: account, theme, cart */}
        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-4">
          {user ? (
            <>
              <Link href="/profile" className={`hidden lg:inline ${navLink}`}>
                Account
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
                className="ui-caps hidden h-9 items-center rounded-md bg-cta px-4 text-2xs text-cta-fg transition-colors hover:bg-cta-hover lg:inline-flex"
              >
                Sign up
              </Link>
            </>
          )}

          {/* Hidden on the narrowest screens, where the header already has
              the identity, cart and menu trigger competing for 320px — the
              mobile sheet carries it there instead. */}
          <span className="hidden sm:inline-flex">
            <ThemeToggle />
          </span>

          <CartBadge />
          <MobileNav isLoggedIn={!!user} isStaff={staff} isAdmin={admin} />
        </div>
      </div>
    </header>
  );
}

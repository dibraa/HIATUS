import Link from "next/link";
import { getCurrentUser, accessOf } from "@/lib/auth";
import { apiJson } from "@/lib/api-client";
import { getServerToken } from "@/lib/server-token";
import { isAdmin, isStaff, isStaffOnly } from "@/lib/roles";
import { BrandMark } from "@/components/brand";
import { CartBadge } from "@/components/cart-badge";
import { SignOutButton } from "@/components/sign-out-button";
import { MobileNav } from "@/components/mobile-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notification-bell";
import type { OrderNotification } from "@/types/database";

/**
 * Sticky site header.
 *
 * Identity (the logo mark) sits left, primary nav follows it from `lg` up,
 * account/cart sit right — small tracked mono caps on the bare cream, no
 * card, no shadow, no rule underneath: the blur alone lifts it off the page.
 *
 * Search deliberately does NOT live here. It filters the menu, so it sits with
 * the menu (see `app/page.tsx`); putting it in the header cost the row the
 * space the identity and role-gated links already need at narrow widths.
 *
 * The work links are role-gated. A barista sees "Counter", an owner sees both
 * "Counter" and "Admin", and a customer sees neither — a nav link to a page
 * that will bounce you is worse than no link at all. The same rule hides the
 * menu and cart from guests: both sit behind sign-in.
 */
export async function Navbar() {
  const user = await getCurrentUser();
  const access = accessOf(user);

  const staff = isStaff(access);
  const admin = isAdmin(access);
  const staffOnly = isStaffOnly(access);
  const token = user && !staffOnly ? await getServerToken() : null;
  const notifications = user && !staffOnly
    ? await apiJson<OrderNotification[]>("/account/notification-feed", { token: token ?? undefined }).catch(() => [])
    : [];

  const navLink =
    "ui-caps text-2xs text-ink-soft transition-colors hover:text-ink";

  return (
    <header className="sticky top-0 z-40 bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        {/* Identity */}
        <Link
          href={staffOnly ? "/staff" : "/"}
          aria-label={
            staffOnly
              ? "Hiatus Coffee, go to counter"
              : user
                ? "Hiatus Coffee, go to menu"
                : "Hiatus Coffee, go to home page"
          }
          className="group flex shrink-0 items-center text-ink"
        >
          {/* The mark IS the word, so no text sits beside it; the label above
              names the destination for assistive tech. */}
          <BrandMark className="h-7" />
        </Link>

        {/* Primary nav — collapses into MobileNav below lg */}
        <nav aria-label="Main" className="hidden shrink-0 items-center gap-6 lg:flex">
          {user && !staffOnly && (
            <>
              <Link href="/" className={navLink}>
                Home
              </Link>
              <Link href="/menu" className={navLink}>
                Menu
              </Link>
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

        {/* Right: account, cart */}
        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-4">
          {user ? (
            <>
              {!staffOnly && (
                <Link href="/profile" className={`hidden h-10 items-center lg:inline-flex ${navLink}`}>
                  Account
                </Link>
              )}
              <span className="hidden h-10 items-center lg:inline-flex">
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

          <span className="hidden sm:inline-flex">
            <ThemeToggle />
          </span>

          {user && !staffOnly && <NotificationBell notifications={notifications} />}
          {user && !staffOnly && <CartBadge />}
          <MobileNav isLoggedIn={!!user} isStaff={staff} isAdmin={admin} staffOnly={staffOnly} />
        </div>
      </div>
    </header>
  );
}

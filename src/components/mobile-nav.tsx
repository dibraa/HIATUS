"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";

/**
 * Small-screen navigation sheet.
 *
 * Keyboard and screen-reader behaviour that a plain toggle would miss:
 * - Escape closes it and returns focus to the trigger (WCAG 2.1.2, No Keyboard Trap)
 * - `aria-expanded` / `aria-controls` tie the trigger to the panel
 * - it closes on route change, so a tap-through does not leave it hanging open
 * - background scroll is locked while it is open
 */
export function MobileNav({
  isLoggedIn,
  isStaff,
  isAdmin,
}: {
  isLoggedIn: boolean;
  /** True for admins too — an owner working the counter is the normal case. */
  isStaff: boolean;
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  // Close on navigation — the panel outlives the tap that caused it otherwise.
  // Adjusted during render rather than in an effect: React re-runs this
  // component immediately with the new state, so the open panel never paints
  // on the destination route (and it avoids the cascading-render effect).
  const [renderedPathname, setRenderedPathname] = useState(pathname);
  if (pathname !== renderedPathname) {
    setRenderedPathname(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const linkClass =
    "ui-caps flex min-h-11 items-center rounded-md px-3 text-2xs text-ink-soft " +
    "transition-colors hover:bg-raised hover:text-ink";

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        className="flex h-10 w-10 items-center justify-center rounded-md text-ink transition-colors hover:bg-raised lg:hidden"
        onClick={() => setOpen((v) => !v)}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
          {open ? (
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          ) : (
            <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
          )}
        </svg>
      </button>

      {open && (
        <>
          {/* Scrim: closing on an outside tap is the expected gesture */}
          <div
            // top-16 matches the header height, so the scrim never covers the
            // close button it is meant to sit behind
            className="fixed inset-0 top-16 z-30 bg-scrim lg:hidden"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          <nav
            id="mobile-nav-panel"
            aria-label="Main"
            className="absolute inset-x-0 top-full z-40 flex flex-col gap-0.5 border-b border-line bg-card p-3 shadow-md lg:hidden"
          >
            <Link href="/" className={linkClass}>
              Menu
            </Link>

            {/* Below sm the header has no room for the toggle, so it lives
                here. Above sm both are rendered but only one is visible. */}
            <div className="sm:hidden">
              <ThemeToggle variant="row" />
            </div>

            {isLoggedIn ? (
              <>
                <Link href="/orders" className={linkClass}>
                  My orders
                </Link>
                <Link href="/favorites" className={linkClass}>
                  Saved
                </Link>
                <Link href="/profile" className={linkClass}>
                  Profile
                </Link>

                {/* Work links are separated by a rule: they go somewhere a
                    customer never does, and running them into the account
                    links makes the sheet read as one undifferentiated list. */}
                {(isStaff || isAdmin) && (
                  <div className="mt-1 flex flex-col gap-0.5 border-t border-line pt-1">
                    {isStaff && (
                      <Link href="/staff" className={linkClass}>
                        Counter
                      </Link>
                    )}
                    {isAdmin && (
                      <Link href="/admin" className={linkClass}>
                        Admin
                      </Link>
                    )}
                  </div>
                )}
                <div className="mt-1 border-t border-line px-3 pt-3">
                  <SignOutButton />
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className={linkClass}>
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="ui-caps mt-1 flex min-h-11 items-center justify-center rounded-md bg-cta px-4 text-2xs text-cta-fg transition-colors hover:bg-cta-hover"
                >
                  Create account
                </Link>
              </>
            )}
          </nav>
        </>
      )}
    </>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Bottom tab bar for signed-in customers on phones (below `md`): the four
 * top-level places, icon + label, the current one marked with
 * `aria-current` and a bar — never by colour alone. The cart keeps its badge
 * in the top bar, so it is always one tap away without a fifth tab.
 *
 * A spacer the bar's height sits before it, so the page (footer included)
 * can scroll clear of it. Height is shared with pinned elements through the
 * --tabbar-h variable in globals.css.
 */
const TABS = [
  { href: "/", label: "Home", match: (p: string) => p === "/", icon: <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" /> },
  {
    href: "/menu",
    label: "Menu",
    match: (p: string) => p.startsWith("/menu"),
    icon: (
      <>
        <path d="M4 8h13v5a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6z" />
        <path d="M17 9h1.5a2.5 2.5 0 0 1 0 5H17" />
      </>
    ),
  },
  {
    href: "/orders",
    label: "Orders",
    match: (p: string) => p.startsWith("/orders"),
    icon: (
      <>
        <path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2z" />
        <path d="M9 8h6M9 12h6" />
      </>
    ),
  },
  {
    href: "/profile",
    label: "Profile",
    match: (p: string) => p.startsWith("/profile") || p.startsWith("/favorites"),
    icon: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
  },
];

export function CustomerTabBar() {
  const pathname = usePathname();

  return (
    <>
      <div aria-hidden="true" className="h-[var(--tabbar-h)] md:hidden" />
      <nav
        aria-label="Main"
        className="customer-tabbar fixed inset-x-0 bottom-0 z-40 grid h-17 grid-cols-4 border-t border-line bg-card pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {TABS.map((tab) => {
          const current = tab.match(pathname);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={current ? "page" : undefined}
              className={`ui-caps relative flex flex-col items-center justify-center gap-1 text-[0.6875rem] ${
                current ? "text-ink" : "text-muted"
              }`}
            >
              {current && (
                <span aria-hidden="true" className="absolute inset-x-[30%] top-0 h-[3px] rounded-b bg-ink" />
              )}
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-5 w-5 fill-none stroke-current"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {tab.icon}
              </svg>
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

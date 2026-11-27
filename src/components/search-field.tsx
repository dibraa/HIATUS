"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Menu search.
 *
 * Typing updates the `q` URL parameter with a short debounce. This keeps the
 * search shareable and back-button friendly while removing the need for a
 * submit action.
 */
export function SearchField({
  query,
  /** Carried through so searching does not silently drop the active flavour filter. */
  flavor: _flavor,
  category: _category,
  className = "",
  id = "menu-search",
}: {
  query?: string;
  flavor?: string;
  category?: string;
  className?: string;
  id?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [prevQuery, setPrevQuery] = useState(query);
  const [value, setValue] = useState(query ?? "");

  if (prevQuery !== query) {
    setPrevQuery(query);
    setValue(query ?? "");
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const currentQuery = (searchParams.get("q") ?? "").trim();
      const nextQuery = value.trim();
      if (currentQuery === nextQuery) return;

      const params = new URLSearchParams(searchParams.toString());
      if (nextQuery) params.set("q", nextQuery);
      else params.delete("q");
      params.delete("page");

      const qs = params.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    }, 180);

    return () => window.clearTimeout(timeout);
  }, [pathname, router, searchParams, value]);

  return (
    <div className={`relative ${className}`}>
      <label htmlFor={id} className="sr-only">
        Search the menu
      </label>

      <svg
        viewBox="0 0 20 20"
        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        aria-hidden="true"
      >
        <circle cx="9" cy="9" r="5.5" />
        <path d="M13.5 13.5L17 17" strokeLinecap="round" />
      </svg>

      <input
        id={id}
        type="search"
        name="q"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search food, drinks or flavours"
        autoComplete="off"
        className="h-12 w-full rounded-md border border-line-strong bg-card pl-10 pr-4 text-sm text-ink placeholder:text-muted transition-colors hover:border-ink focus:border-ink focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      />
    </div>
  );
}

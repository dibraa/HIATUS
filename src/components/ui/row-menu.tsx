"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export function RowMenu({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open ]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="grid h-11 w-11 place-items-center rounded-md border border-line-strong text-ink transition-colors hover:bg-raised"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
          <circle cx="5" cy="12" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="19" cy="12" r="1.8" />
        </svg>
      </button>
      {open && (
        <div
          role="menu"
          onClick={() => setOpen(false)}
          className="absolute right-0 top-[calc(100%+6px)] z-20 grid min-w-60 rounded-xl bg-card p-1.5 shadow-md ring-1 ring-line-strong"
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function RowMenuItem({
  children,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`min-h-11 rounded-lg px-3 text-left text-sm transition-colors hover:bg-raised ${danger ? "text-danger" : "text-ink"}`}
    >
      {children}
    </button>
  );
}

export function RowMenuLink({ children, href }: { children: React.ReactNode; href: string }) {
  return (
    <Link
      role="menuitem"
      href={href}
      className="flex min-h-11 items-center rounded-lg px-3 text-sm text-ink transition-colors hover:bg-raised"
    >
      {children}
    </Link>
  );
}

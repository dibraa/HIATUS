"use client";

import { usePathname } from "next/navigation";

export function AdminBackButton() {
  const pathname = usePathname();

  if (pathname !== "/admin/menu/new") return null;

  function goBack() {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.assign("/admin");
    }
  }

  return (
    <div className="mb-5 flex justify-end">
      <button
        type="button"
        onClick={goBack}
        aria-label="Go back"
        title="Go back"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-accent-ink transition-colors hover:bg-accent hover:text-accent-fg"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden="true"
        >
          <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

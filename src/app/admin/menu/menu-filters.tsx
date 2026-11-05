"use client";

import { useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { TextField, SelectField } from "@/components/ui/field";
import type { Category } from "./menu-management";

export function MenuFilters({
  categories,
  values,
}: {
  categories: Category[];
  values: { search: string; category: string; available: string };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [filters, setFilters] = useState(values);
  const searchTimer = useRef<number | null>(null);

  function apply(next: typeof values) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
    }
    router.push(`${pathname}${params.toString() ? `?${params}` : ""}`);
  }

  function update(key: keyof typeof filters, value: string) {
    const next = { ...filters, [key]: value };
    setFilters(next);
    if (key === "search") {
      if (searchTimer.current) window.clearTimeout(searchTimer.current);
      searchTimer.current = window.setTimeout(() => apply(next), 350);
    } else {
      apply(next);
    }
  }

  return (
    <form className="admin-panel mb-5 grid items-end gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Menu filters" onSubmit={event => event.preventDefault()}>
      <TextField id="menu-search" name="search" label="Search menu" type="search" maxLength={100} placeholder="Item name" value={filters.search} onChange={event => update("search", event.target.value)} />
      <SelectField id="menu-category" name="category" label="Category" value={filters.category} onChange={event => update("category", event.target.value)}>
        <option value="">All categories</option>
        {categories.map(category => <option key={category.name} value={category.name}>{category.name}</option>)}
      </SelectField>
      <SelectField id="menu-available" name="available" label="Availability" value={filters.available} onChange={event => update("available", event.target.value)}>
        <option value="">All items</option>
        <option value="true">Available</option>
        <option value="false">Unavailable</option>
      </SelectField>
    </form>
  );
}

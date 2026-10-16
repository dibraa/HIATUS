"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/format";
import type { PopularItemRow } from "@/types/database";

export function ItemsTable({ items }: { items: PopularItemRow[] }) {
  const [showItemsTable, setShowItemsTable] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setShowItemsTable((value) => !value)}
        aria-expanded={showItemsTable}
        className="inline-flex min-h-11 items-center text-sm font-medium text-accent-ink underline underline-offset-4 transition-colors hover:text-ink"
      >
        {showItemsTable ? "Hide details" : "View details"}
      </button>
      {showItemsTable && (
        <div className="admin-table-scroll mt-3" tabIndex={0} role="region" aria-label="Item sales details">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead>
              <tr className="border-b border-line eyebrow text-muted">
                <th scope="col" className="py-2 pr-4 font-medium">Item</th>
                <th scope="col" className="py-2 pr-4 font-medium">Flavor</th>
                <th scope="col" className="py-2 pr-4 text-right font-medium">Units</th>
                <th scope="col" className="py-2 text-right font-medium">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={`${row.item_name}-${row.flavor}`} className="border-b border-line last:border-0">
                  <th scope="row" className="py-2.5 pr-4 text-left font-medium text-ink">{row.item_name}</th>
                  <td className="py-2.5 pr-4 text-ink-soft">{row.flavor}</td>
                  <td className="py-2.5 pr-4 text-right font-semibold numeric text-ink">{row.total_quantity}</td>
                  <td className="py-2.5 text-right numeric text-ink-soft">{formatPrice(row.total_revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/**
 * CSV export.
 *
 * Small enough to own rather than to take a dependency for, but not so small
 * that the naive `rows.join(",")` version is correct — that one corrupts every
 * export the moment a drink is called "Mocha, large" or a note contains a
 * newline, and it does so silently.
 *
 * RFC 4180 rules, which is what Excel, Numbers and Sheets all actually read:
 *   - a field containing a comma, a quote, CR or LF is wrapped in quotes
 *   - a literal quote inside a quoted field is doubled
 *   - rows are separated by CRLF
 */

export type CsvValue = string | number | boolean | null | undefined;

function escapeField(value: CsvValue): string {
  if (value === null || value === undefined) return "";

  const text = String(value);
  // A leading =, +, - or @ makes a spreadsheet treat the cell as a formula.
  // Customer-supplied text (an order note, a name) reaches this function, so
  // the cell is prefixed with a quote to keep it inert — CSV injection is a
  // real path from "leave a note for the shop" to "run something on the
  // owner's machine".
  const guarded = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;

  if (/[",\r\n]/.test(guarded)) {
    return `"${guarded.replace(/"/g, '""')}"`;
  }
  return guarded;
}

export type CsvColumn<T> = {
  header: string;
  /** Pulled as a function so a column can format or combine fields. */
  value: (row: T) => CsvValue;
};

export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const head = columns.map((c) => escapeField(c.header)).join(",");
  const body = rows.map((row) =>
    columns.map((c) => escapeField(c.value(row))).join(",")
  );
  return [head, ...body].join("\r\n");
}

/**
 * Hands the file to the browser.
 *
 * The BOM is not decoration: without it Excel on Windows reads the file as the
 * system codepage and mangles every ₱ and every accented name. Sheets and
 * Numbers ignore it.
 */
export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Revoking immediately can cancel the download in some browsers; a tick is
  // enough for the navigation to have been queued.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/** `hiatus-sales-2026-08-28.csv` — dated so successive exports do not collide. */
export function datedFilename(prefix: string): string {
  const stamp = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return `hiatus-${prefix}-${stamp}.csv`;
}

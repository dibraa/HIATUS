export const MENU_PAGE_SIZE = 8;

/** Keep malformed URLs and shrinking filter results inside the available pages. */
export function menuPage(total: number, requested?: string) {
  const pages = Math.max(1, Math.ceil(total / MENU_PAGE_SIZE));
  const value = requested && /^\d+$/.test(requested) ? Number(requested) : 1;
  const page = Math.min(pages, Math.max(1, Number.isSafeInteger(value) ? value : 1));
  const start = (page - 1) * MENU_PAGE_SIZE;
  return { page, pages, start, end: start + MENU_PAGE_SIZE };
}

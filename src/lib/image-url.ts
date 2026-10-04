export function resolveImageUrl(src: string | null): string | null {
  if (!src) return null;

  try {
    const url = new URL(src);
    if (url.pathname.startsWith("/uploads/")) {
      return `${url.pathname}${url.search}`;
    }
    return src;
  } catch {
    return src.startsWith("/uploads/") ? src : `/${src.replace(/^\/+/, "")}`;
  }
}

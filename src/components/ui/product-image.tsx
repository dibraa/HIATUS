import Image from "next/image";

/**
 * Product imagery with a guaranteed aspect ratio and a real fallback.
 *
 * The ratio is held by the wrapper, not the image, so the grid never reflows
 * when a photo loads (no layout shift) and items with no photo still occupy
 * their slot instead of collapsing.
 */
export function ProductImage({
  src,
  alt,
  /**
   * Matches the CSS width the image will occupy at each breakpoint so the
   * browser can pick the right candidate from the generated srcset. Wrong
   * values here are the usual cause of oversized image downloads.
   */
  sizes,
  /** Set on the one above-the-fold image (the featured drink) — it is the LCP. */
  priority = false,
  className = "",
  rounded = "rounded-lg",
  tone = "light",
}: {
  src: string | null;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  rounded?: string;
  /** "dark" when the image sits on an inverted panel, so the empty-state
      placeholder does not read as a white slab cut out of the dark card. */
  tone?: "light" | "dark";
}) {
  const placeholderBg = tone === "dark" ? "bg-inverse-line/40" : "bg-raised";
  const placeholderFg = tone === "dark" ? "text-inverse-muted" : "text-muted";

  return (
    <div
      className={`relative aspect-square w-full overflow-hidden ${placeholderBg} ${rounded} ${className}`}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          // Everything below the fold defers; the LCP image must not.
          loading={priority ? "eager" : "lazy"}
          className="object-cover transition-transform duration-(--hi-dur-slow) ease-hi-out group-hover:scale-[1.03]"
        />
      ) : (
        // Decorative placeholder: the product name is already adjacent in the
        // DOM, so this must not repeat it to a screen reader.
        <div
          aria-hidden="true"
          className={`flex h-full w-full items-center justify-center ${placeholderFg}`}
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-1/3 w-1/3" stroke="currentColor" strokeWidth="1.25">
            <path d="M4 8h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8z" strokeLinejoin="round" />
            <path d="M17 9h1.5a2.5 2.5 0 0 1 0 5H17" strokeLinecap="round" />
            <path d="M8 2.5c0 1-1 1.5-1 2.5M12 2.5c0 1-1 1.5-1 2.5" strokeLinecap="round" />
          </svg>
        </div>
      )}
    </div>
  );
}

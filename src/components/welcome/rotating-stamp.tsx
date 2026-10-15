/**
 * The pine stamp that laps over the hero photograph's corner: a ring of mono
 * caps turning slowly around a two-word centre. Decorative — the same words
 * are the page's own tagline — so the whole mark is hidden from screen readers.
 *
 * Only the ring turns (`hi-spin` in globals.css); the centre stays upright so
 * it can always be read. The global reduced-motion rule stops the turn.
 */
export function RotatingStamp({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`grid aspect-square place-items-center rounded-full bg-inverse-bg text-inverse-fg ${className}`}
    >
      <svg
        viewBox="0 0 128 128"
        className="stamp-spin absolute inset-0 h-full w-full"
      >
        <defs>
          <path id="stamp-ring" d="M64 64m-48 0a48 48 0 1 1 96 0a48 48 0 1 1-96 0" />
        </defs>
        <text
          fill="currentColor"
          fontSize="9.6"
          letterSpacing="2.6"
          style={{ fontFamily: "var(--font-ui)" }}
        >
          <textPath href="#stamp-ring">TAKE THAT MUCH NEEDED BREAK · </textPath>
        </text>
      </svg>
      <span className="display text-center text-lg leading-none max-lg:text-sm">
        Come
        <br />
        in
      </span>
    </div>
  );
}

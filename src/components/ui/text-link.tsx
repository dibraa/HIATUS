import Link from "next/link";
import type { ComponentProps } from "react";

/**
 * An inline text link in running prose: "No account yet? Create one."
 *
 * The one place a link looks like a link rather than a button or a nav item.
 * Accent ink with an underline at rest — the underline is what makes it a
 * link for anyone who cannot see colour — and the whole thing goes to ink on
 * hover, which is the system's "the control is under the cursor" repaint.
 *
 * `block` lifts it out of the sentence as a standalone line with a 44px hit
 * area. Inline boxes ignore `min-height`, so a lone link ("Forgot your
 * password?", "Back to log in") would otherwise be an 18px target on a phone,
 * and the global coarse-pointer rule could not save it.
 */
const INLINE =
  "font-medium text-accent-ink underline underline-offset-4 transition-colors hover:text-ink";

const BLOCK = `${INLINE} inline-flex min-h-11 items-center`;

type TextLinkProps = ComponentProps<typeof Link> & {
  /** Render as a standalone line with a full touch target. */
  block?: boolean;
};

export function TextLink({ block = false, className, ...props }: TextLinkProps) {
  return (
    <Link
      className={[block ? BLOCK : INLINE, className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}

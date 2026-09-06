import Link from "next/link";
import type { ComponentProps } from "react";

/**
 * The storefront's one button API.
 *
 * `Button` renders a <button>, `ButtonLink` renders a Next <Link> with the
 * same visuals — so a navigation CTA and an action CTA can look identical
 * without a link ever pretending to be a button (or vice versa) in the
 * accessibility tree.
 *
 * Two things come straight from the comp and are easy to lose:
 *
 *   1. LABELS ARE MONO CAPS, not sentence case in the prose face. That is why
 *      the size scale below steps DOWN a notch from the old one — 0.12em of
 *      tracking on uppercase mono makes a 14px label occupy the width a 16px
 *      sentence-case one used to.
 *   2. THE CORNER IS A RECTANGLE'S, not a pill's. `rounded-md` is 10px in this
 *      system; the comp's buttons are soft rectangles, and a full pill reads
 *      as a different, chattier brand.
 */

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "inverse"
  | "danger";
export type ButtonSize = "sm" | "md" | "lg";

/* Colour is on the fast duration (the default) so a hover reads as the control
 * repainting under the cursor. The press is the one place a button MOVES: a
 * single pixel down on :active, on the spring curve, so the overshoot on
 * release makes a tap feel answered. It is deliberately the only transform in
 * the button — a hover lift on top of it would be two effects competing to say
 * the same thing, and the comp's signature is already the outline variant
 * filling to espresso. */
const BASE =
  "ui-caps inline-flex items-center justify-center gap-2 rounded-md " +
  "transition-[background-color,border-color,color,translate] " +
  "active:translate-y-px active:duration-(--hi-dur-base) active:ease-hi-spring " +
  "disabled:cursor-not-allowed disabled:opacity-45 disabled:active:translate-y-0 " +
  // Pointer-events off on the icon keeps click targets on the control itself
  "[&_svg]:pointer-events-none [&_svg]:shrink-0";

const VARIANTS: Record<ButtonVariant, string> = {
  /** Highest-emphasis action: Add to cart, Checkout, Place order. One per view
   *  where possible. Espresso, not orange — in the comp the loudest button on
   *  the page is near-black, and burnt orange is a highlight colour that would
   *  lose its meaning if every form ended in it. */
  primary: "bg-cta text-cta-fg hover:bg-cta-hover active:bg-cta",
  /** Supporting action that still carries weight — the brand's pine. */
  secondary:
    "bg-secondary text-secondary-fg hover:bg-secondary-hover active:bg-secondary",
  /** The comp's product-card button: a bordered surface control at rest that
   *  FILLS TO ESPRESSO on hover, rather than merely tinting. That flip is the
   *  single most recognisable interaction in the reference, so it lives in the
   *  shared variant instead of being re-implemented per card. */
  outline:
    "border border-line-strong bg-card text-ink hover:border-cta hover:bg-cta hover:text-cta-fg active:bg-cta-hover",
  /** Lowest emphasis — icon buttons, tertiary links. */
  ghost: "bg-transparent text-ink-soft hover:bg-raised hover:text-ink active:bg-line/60",
  /** For use ON an inverted (pine) panel, where BOTH primary and secondary
   *  vanish — espresso on pine is a hole, and green on green is nothing at
   *  all. Cream fill, pine text. */
  inverse:
    "bg-inverse-fg text-inverse-bg hover:bg-inverse-fg/85 active:bg-inverse-fg/75 " +
    "focus-visible:outline-inverse-fg",
  /** Destructive confirmation only — cancelling an order, deleting an item.
   *  Never the default action in a pair. */
  danger:
    "border border-danger/50 bg-card text-danger hover:border-danger hover:bg-danger-soft-bg",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-2xs",
  md: "h-11 px-5 text-xs",
  lg: "h-12 px-6 text-sm",
};

function classesFor(variant: ButtonVariant, size: ButtonSize, className?: string) {
  return [BASE, VARIANTS[variant], SIZES[size], className].filter(Boolean).join(" ");
}

type ButtonProps = ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button type={type} className={classesFor(variant, size, className)} {...props} />
  );
}

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonLinkProps) {
  return <Link className={classesFor(variant, size, className)} {...props} />;
}

import Link from "next/link";
import type { ComponentProps } from "react";

/**
 * The storefront's one button API.
 *
 * `Button` renders a <button>, `ButtonLink` renders a Next <Link> with the
 * same visuals — so a navigation CTA and an action CTA can look identical
 * without a link ever pretending to be a button (or vice versa) in the
 * accessibility tree.
 */

export type ButtonVariant = "primary" | "secondary" | "ghost" | "inverse";
export type ButtonSize = "sm" | "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium " +
  "transition-colors duration-150 ease-hi " +
  "disabled:cursor-not-allowed disabled:opacity-45 " +
  // Pointer-events off on the icon keeps click targets on the control itself
  "[&_svg]:pointer-events-none [&_svg]:shrink-0";

const VARIANTS: Record<ButtonVariant, string> = {
  /** Highest-emphasis action: Add to cart, Checkout. One per view where possible. */
  primary: "bg-accent text-accent-fg hover:bg-accent-hover active:bg-ink",
  /** Supporting action that still needs an edge. */
  secondary:
    "bg-card text-ink border border-line-strong hover:bg-raised active:bg-line/60",
  /** Lowest emphasis — icon buttons, tertiary links. */
  ghost: "bg-transparent text-ink-soft hover:bg-raised hover:text-ink active:bg-line/60",
  /** For use ON a dark surface (hero, featured card), where primary would vanish. */
  inverse:
    // Hover dims toward the panel behind it rather than brightening to pure
    // white - white was an off-token value that only made sense in the light
    // theme, where the panel underneath happened to be near-black.
    "bg-inverse-fg text-inverse-bg hover:bg-inverse-fg/85 active:bg-inverse-fg/75 " +
    "focus-visible:outline-inverse-fg",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-xs",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-base",
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

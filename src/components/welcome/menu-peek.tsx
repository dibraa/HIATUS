import Link from "next/link";
import { ProductImage } from "@/components/ui/product-image";
import { formatPrice } from "@/lib/format";
import type { MenuPeek as MenuPeekData } from "@/lib/menu-peek";
import { priceForSize } from "@/lib/sizes";

/**
 * "On the menu": a sneak peek between the room and the tour — a few drinks
 * with their starting price, and the categories the full menu holds.
 *
 * Every card leads to sign-up: product pages sit behind sign-in
 * (AUTH_REQUIRED_PREFIXES), so linking a guest to /menu/[id] would only bounce
 * them to the login page with no context. The price is the SMALL size's — the
 * same "from" figure the signed-in menu card prints under its default price.
 *
 * The row always ends in a pine "whole menu" tile. It is the section's way
 * forward, and it keeps a short menu (one or two available drinks) from
 * leaving a lone card beside an empty row.
 */
export function MenuPeek({ peek }: { peek: MenuPeekData }) {
  return (
    <section aria-labelledby="peek-heading" className="scroll-mt-20" id="menu-peek">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 id="peek-heading" className="display text-6xl text-ink">
            On the menu
          </h2>
          {peek.categories.length > 0 && (
            <p className="ui-caps mt-snug text-2xs text-muted">
              {peek.categories.join(" · ")}
            </p>
          )}
        </div>
        <Link
          href="/signup"
          // Inline text ignores the global 44px coarse-pointer rule, so the hit
          // area is set here: the link sits alone on its row and is easy to miss.
          className="ui-caps inline-flex min-h-11 items-center text-2xs text-accent-ink underline underline-offset-4 transition-colors hover:text-ink"
        >
          See the full menu
        </Link>
      </div>

      <ul className="mt-heading grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {peek.items.map((item) => (
          <li key={item.id} className="flex">
            <Link
              href="/signup"
              aria-label={`${item.name}, from ${formatPrice(priceForSize(item.price, "S"))}. Sign up to order.`}
              // The same matte as the hero photograph: card ground, 10px gutter, 2xl
              // corner around an xl image. Spelled out rather than `.matte` so the
              // hover tint can still win (that class is unlayered). The one-pixel
              // press is the button's: on touch there is no hover, so it is the
              // only sign a tap landed before the sign-up page loads.
              className="group flex w-full flex-col rounded-2xl bg-card p-2.5 transition-[background-color,translate] hover:bg-raised active:translate-y-px focus-visible:outline-offset-4"
            >
              <ProductImage
                src={item.image_url}
                alt=""
                sizes="(min-width: 1024px) 270px, 45vw"
                rounded="rounded-xl"
              />
              <div className="flex flex-1 flex-col gap-1 px-1.5 pb-1.5 pt-3">
                <p className="eyebrow text-muted">{item.flavor}</p>
                <p className="display text-lg text-ink group-hover:underline group-hover:underline-offset-4">
                  {item.name}
                </p>
                <p className="numeric mt-auto pt-1 text-sm text-ink-soft">
                  from {formatPrice(priceForSize(item.price, "S"))}
                </p>
              </div>
            </Link>
          </li>
        ))}
        {/* Full width wherever the grid is two-up (phones AND tablets, below
            `lg`) when it would otherwise sit alone in a row. The hover darkens
            the pine itself rather than borrowing secondary-hover, which turns
            light sage in dark mode under cream text. */}
        <li className={`flex ${peek.items.length % 2 === 0 ? "max-lg:col-span-2" : ""}`}>
          <Link
            href="/signup"
            className="flex w-full flex-col justify-between gap-6 rounded-2xl bg-inverse-bg p-5 text-inverse-fg transition-[filter,translate] hover:brightness-90 active:translate-y-px focus-visible:outline-offset-4 sm:p-6"
          >
            <span className="display text-4xl text-inverse-display">
              The whole
              <br />
              menu
            </span>
            <span>
              <span className="block text-sm text-inverse-muted">
                Sign up to see every drink, pick your size, and order ahead.
              </span>
              <span className="ui-caps mt-4 inline-block text-2xs underline underline-offset-4">
                Sign up &rarr;
              </span>
            </span>
          </Link>
        </li>
      </ul>
    </section>
  );
}

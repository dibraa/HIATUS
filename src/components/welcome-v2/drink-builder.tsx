"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { ProductImage } from "@/components/ui/product-image";
import { formatPrice } from "@/lib/format";
import { DEFAULT_SIZE, SIZE_OPTIONS, getSizeOption, priceForSize, servingLabel, type DrinkSize } from "@/lib/sizes";
import type { MenuItem } from "@/types/database";
import styles from "./welcome-v2.module.css";

/**
 * "Build your own break": pick a drink and a size, see it and its price, then
 * go to its page to order. Only choices the shop really offers; the price
 * comes from the same priceForSize the cart uses, so it matches checkout.
 */
export function DrinkBuilder({ drinks }: { drinks: MenuItem[] }) {
  const [drinkId, setDrinkId] = useState(drinks[0].id);
  const [size, setSize] = useState<DrinkSize>(DEFAULT_SIZE);
  const drink = drinks.find((d) => d.id === drinkId) ?? drinks[0];
  const sized = drink.pricing_mode !== "fixed";
  const price = priceForSize(drink.price, size, drink.size_pricing, drink.pricing_mode);

  return (
    <section aria-labelledby="v2-builder-heading" className="bg-inverse-card py-band text-inverse-card-fg">
      <div className="mx-auto max-w-6xl px-4 sm:px-8">
        <div className="text-center">
          <p className="eyebrow text-inverse-card-muted">Make it yours</p>
          <h2 id="v2-builder-heading" className="display mt-3 text-6xl">
            Build your own{" "}
            <span className={`${styles.jelly} inline-block rotate-1 rounded-lg bg-accent px-[0.16em] pt-[0.06em] text-accent-fg`}>
              break
            </span>
          </h2>
        </div>

        <div className="mt-heading grid items-center gap-10 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <div className="relative mx-auto grid aspect-square w-full max-w-sm place-items-center rounded-full bg-inverse-bg">
            <span aria-hidden="true" className="absolute top-[9%] text-2xl text-inverse-display">
              <span className={styles.beat}>♥</span>
            </span>
            <div key={drink.id} className={`${styles.pop} w-[64%]`}>
              <ProductImage
                src={drink.image_url}
                itemType={drink.item_type}
                alt={drink.name}
                sizes="(min-width: 768px) 15rem, 60vw"
                rounded="rounded-full"
                tone="dark"
                className="ring-8 ring-inverse-fg/90"
              />
            </div>
          </div>

          <div className="grid gap-6">
            <ChoiceGroup legend="1. Drink">
              {drinks.map((d) => (
                <Chip key={d.id} selected={d.id === drink.id} onClick={() => setDrinkId(d.id)}>
                  {d.name}
                </Chip>
              ))}
            </ChoiceGroup>

            <ChoiceGroup legend="2. Size">
              {sized ? (
                SIZE_OPTIONS.map((option) => (
                  <Chip key={option.code} selected={option.code === size} onClick={() => setSize(option.code)}>
                    {option.label} · {option.volume}
                  </Chip>
                ))
              ) : (
                <p className="text-sm text-inverse-card-muted">One size · {servingLabel(drink)}</p>
              )}
            </ChoiceGroup>

            <div className="flex flex-wrap items-end justify-between gap-4 border-t border-inverse-card-muted/25 pt-6">
              <div>
                <p className="text-sm text-inverse-card-muted">
                  {drink.name} · {sized ? getSizeOption(size).label : servingLabel(drink)}
                </p>
                <p className="numeric mt-1 text-3xl" aria-live="polite">
                  <span key={`${drink.id}-${size}`} className={styles.bump}>
                    {formatPrice(price)}
                  </span>
                </p>
              </div>
              <Link
                href={`/menu/${drink.id}?from=home`}
                className={`${styles.spring} ui-caps inline-flex min-h-12 items-center rounded-full bg-accent px-6 text-xs text-accent-fg hover:bg-accent-hover`}
              >
                Order this →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ChoiceGroup({ legend, children }: { legend: string; children: ReactNode }) {
  return (
    <fieldset>
      <legend className="ui-caps text-2xs text-inverse-card-muted">{legend}</legend>
      <div className="mt-3 flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`${styles.spring} ui-caps inline-flex min-h-10 items-center rounded-full px-4 text-2xs ${
        selected
          ? "bg-inverse-card-fg text-inverse-card"
          : "ring-1 ring-inset ring-inverse-card-muted/40 hover:ring-inverse-card-fg"
      }`}
    >
      {children}
    </button>
  );
}

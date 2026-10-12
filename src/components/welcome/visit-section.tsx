import { ButtonLink } from "@/components/ui/button";
import { SHOP_SOCIALS } from "@/content/shop";
import { groupBusinessHours } from "@/lib/hours";
import type { BusinessHours, ShopInfo } from "@/types/database";

/**
 * "Come by": the hours and the ways to reach the shop, from Settings, so the
 * page never states hours the admin has since changed.
 *
 * Empty settings are omitted rather than filled with placeholders — a guest
 * should never read "Address: —". If nothing at all is known, the "Find us"
 * column disappears and the hours take its place.
 */
export function VisitSection({
  hours,
  shopInfo,
}: {
  hours: BusinessHours[];
  shopInfo: ShopInfo;
}) {
  const groups = groupBusinessHours(hours);
  // `?? ""`: getSettings() fills MISSING keys from defaults, but a key the
  // API returns as null passes through untouched.
  const address = (shopInfo.address ?? "").trim();
  const phone = (shopInfo.phone ?? "").trim();
  const hasContact = Boolean(address || phone || SHOP_SOCIALS.length);

  return (
    <section
      id="visit"
      aria-labelledby="visit-heading"
      className="grid scroll-mt-20 gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)]"
    >
      <div>
        <h2 id="visit-heading" className="display text-5xl text-ink sm:text-6xl">
          Come by
        </h2>
        <p className="mt-snug max-w-[34ch] text-muted">
          Stay a while, or order ahead and grab it on your way.
        </p>
        <div className="mt-stack flex flex-wrap gap-3 max-sm:flex-col max-sm:items-stretch">
          <ButtonLink href="/signup" size="lg">
            Order ahead
          </ButtonLink>
          <ButtonLink href="/login" variant="outline" size="lg">
            Sign in
          </ButtonLink>
        </div>
      </div>

      <div>
        <h3 className="ui-caps text-2xs text-muted">Hours</h3>
        <dl className="mt-snug grid grid-cols-[auto_minmax(0,1fr)] gap-x-5 gap-y-2">
          {groups.map((group) => (
            <div key={group.days} className="contents">
              <dt className="ui-caps text-2xs leading-6 text-ink-soft">{group.days}</dt>
              <dd className="numeric text-sm leading-6 text-ink">{group.hours}</dd>
            </div>
          ))}
        </dl>
      </div>

      {hasContact && (
        <div>
          <h3 className="ui-caps text-2xs text-muted">Find us</h3>
          <ul className="mt-snug grid gap-2 text-ink">
            {address && <li>{address}</li>}
            {phone && (
              <li>
                <a href={`tel:${phone}`} className="underline underline-offset-4 hover:text-accent-ink">
                  {phone}
                </a>
              </li>
            )}
            {SHOP_SOCIALS.map((social) => (
              <li key={social.href}>
                <a
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4 hover:text-accent-ink"
                >
                  {social.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

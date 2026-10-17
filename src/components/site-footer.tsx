import { SHOP_SOCIALS } from "@/content/shop";
import { groupBusinessHours } from "@/lib/hours";
import { getSettings } from "@/lib/settings";

/**
 * Site footer: "Come by" — the hours and how to reach the shop, in one short
 * band closing every customer page on the pine panel.
 *
 * Hours and contact come from Settings, so the footer never states hours the
 * admin has since changed. Empty settings are omitted rather than filled with
 * placeholders; with nothing known at all, the "Find us" column disappears.
 *
 * Information only — no actions: the way in lives in the page and the top
 * bar. Every colour is an `inverse-*` token — `muted` and `line` are
 * unreadable on this ground.
 * `id="visit"` keeps older `/#visit` links landing here.
 */
export async function SiteFooter() {
  const settings = await getSettings();

  const groups = groupBusinessHours(settings.businessHours);
  // `?? ""`: getSettings() fills MISSING keys from defaults, but a key the
  // API returns as null passes through untouched.
  const address = (settings.shopInfo.address ?? "").trim();
  const phone = (settings.shopInfo.phone ?? "").trim();
  const hasContact = Boolean(address || phone || SHOP_SOCIALS.length);

  // inline-flex so the global coarse-pointer 44px min-height can take hold;
  // an inline box ignores min-height and measured 21px tall on touch.
  const contactLink =
    "inline-flex items-center underline underline-offset-4 transition-colors hover:text-inverse-muted";

  return (
    <footer id="visit" aria-labelledby="visit-heading" className="mt-section scroll-mt-20 bg-inverse-bg text-inverse-fg">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <div>
          <h2 id="visit-heading" className="display text-5xl">
            Come by
          </h2>
          <p className="mt-snug max-w-[34ch] text-inverse-muted">
            Stay a while, or order ahead and grab it on your way.
          </p>
        </div>

        <div>
          <h3 className="ui-caps text-2xs text-inverse-muted">Hours</h3>
          <dl className="mt-snug grid grid-cols-[auto_minmax(0,1fr)] gap-x-5 gap-y-1.5">
            {groups.map((group) => (
              <div key={group.days} className="contents">
                <dt className="ui-caps text-2xs leading-6 text-inverse-muted">{group.days}</dt>
                <dd className="numeric text-sm leading-6">{group.hours}</dd>
              </div>
            ))}
          </dl>
        </div>

        {hasContact && (
          <div>
            <h3 className="ui-caps text-2xs text-inverse-muted">Find us</h3>
            <ul className="mt-snug grid gap-1.5">
              {address && <li>{address}</li>}
              {phone && (
                <li>
                  <a href={`tel:${phone}`} className={contactLink}>
                    {phone}
                  </a>
                </li>
              )}
              {SHOP_SOCIALS.map((social) => (
                <li key={social.href}>
                  <a href={social.href} target="_blank" rel="noopener noreferrer" className={contactLink}>
                    {social.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </footer>
  );
}

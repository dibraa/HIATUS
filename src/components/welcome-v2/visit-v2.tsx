import Link from "next/link";
import type { CSSProperties } from "react";
import { doorStatus } from "@/components/welcome-v2/door-status";
import { SHOP_DIRECTIONS_URL, SHOP_PLACE, SHOP_QUOTE, SHOP_ROOM, SHOP_SOCIALS } from "@/content/shop";
import { formatTime } from "@/lib/hours";
import type { BusinessHours } from "@/types/database";
import styles from "./welcome-v2.module.css";

const STRIP = ["lami", "chill", "break time", "salamat", "sarap", "kape pa", "slow down", "sip"];

/**
 * "See you at Hiatus": where, when and a hello, then a giant wordmark and an
 * endless word strip to sign off before the site footer.
 */
export function VisitV2({
  open,
  hours,
  today,
}: {
  open: boolean;
  hours: BusinessHours[];
  today: BusinessHours | null;
}) {
  return (
    <section aria-labelledby="v2-visit-heading" className="overflow-hidden bg-raised pt-band">
      <div className="mx-auto max-w-6xl px-4 text-center">
        <p className="eyebrow text-muted">Visit us</p>
        <h2 id="v2-visit-heading" className="display mt-3 text-6xl text-ink">
          See you at{" "}
          <span className={`${styles.jelly} inline-block rotate-1 rounded-lg bg-accent px-[0.16em] pt-[0.06em] text-accent-fg`}>
            Hiatus
          </span>{" "}
          <span aria-hidden="true" className={styles.beat}>
            ♥
          </span>
        </h2>
        <p className="ui-caps mt-5 inline-flex items-center gap-2 rounded-full bg-card px-4 py-2 text-2xs text-ink">
          <span aria-hidden="true" className={`h-2 w-2 rounded-full ${open ? "bg-success" : "bg-muted"}`} />
          {doorStatus(open, today)}
        </p>

        <div className="mt-heading grid gap-4 text-left sm:grid-cols-3">
          <div className={`${styles.spring} ${styles.lift} rounded-2xl bg-card p-6 shadow-[var(--hi-shadow-md)]`}>
            <p className="ui-caps text-2xs text-accent-ink">Location</p>
            <p className="mt-3 text-ink">{SHOP_ROOM.caption}</p>
            <p className="text-sm text-ink-soft">{SHOP_PLACE.town}</p>
            <a
              href={SHOP_DIRECTIONS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="ui-caps mt-4 inline-flex min-h-11 items-center text-2xs text-accent-ink underline underline-offset-4 hover:text-ink"
            >
              Get directions →<span className="sr-only"> (opens Google Maps)</span>
            </a>
          </div>

          <div className={`${styles.spring} ${styles.lift} rounded-2xl bg-card p-6 shadow-[var(--hi-shadow-md)]`}>
            <p className="ui-caps text-2xs text-accent-ink">Open hours</p>
            {hours.length > 0 ? (
              <ul className="mt-3 grid gap-1">
                {hours.map((h) => (
                  <li
                    key={h.day}
                    aria-current={h.day === today?.day ? "date" : undefined}
                    className={`numeric flex justify-between gap-3 rounded-md px-2 py-1 text-xs ${
                      h.day === today?.day ? "bg-accent-soft text-ink" : "text-ink-soft"
                    }`}
                  >
                    <span>{h.label}</span>
                    <span>{h.closed ? "Closed" : `${formatTime(h.open)} – ${formatTime(h.close)}`}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-ink-soft">Hours are posted at the shop.</p>
            )}
          </div>

          <div className={`${styles.spring} ${styles.lift} rounded-2xl bg-card p-6 shadow-[var(--hi-shadow-md)]`}>
            <p className="ui-caps text-2xs text-accent-ink">Come by</p>
            <p lang={SHOP_QUOTE.lang} className="display mt-3 text-3xl text-ink">
              “{SHOP_QUOTE.text}”
            </p>
            <p className="mt-1 text-sm text-ink-soft">{SHOP_QUOTE.translation}</p>
            <Link
              href="/login"
              className={`${styles.spring} ui-caps mt-4 inline-flex min-h-11 items-center rounded-full bg-cta px-5 text-2xs text-cta-fg hover:bg-cta-hover`}
            >
              Order ahead
            </Link>
          </div>
        </div>

        <ul className="mt-8 flex flex-wrap justify-center gap-2">
          {SHOP_SOCIALS.map((social) => (
            <li key={social.href}>
              <a
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`${styles.spring} ui-caps inline-flex min-h-10 items-center rounded-full bg-ink px-4 text-2xs text-surface`}
              >
                {social.label}
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* The sign-off wordmark, its foot tucked under the strip. `!` because
          `.display` is unlayered and would otherwise force uppercase.
          pointer-events-none: the giant letters' boxes reach up over the
          social links and would swallow their clicks. */}
      <p
        aria-hidden="true"
        className="display pointer-events-none relative mt-band -mb-[0.12em] select-none text-center text-[clamp(5rem,27vw,26rem)] leading-[0.8]! normal-case! text-secondary"
      >
        {[..."hiatus."].map((letter, i) => (
          <span key={i} className={styles.wave} style={{ "--delay": `${i * 0.12}s` } as CSSProperties}>
            {letter}
          </span>
        ))}
      </p>

      <div aria-hidden="true" className="relative overflow-hidden bg-cta py-3 text-cta-fg">
        <div className={styles.track} style={{ "--dur": "35s" } as CSSProperties}>
          {[0, 1].map((pass) => (
            <span key={pass} className="ui-caps flex shrink-0 gap-6 pr-6 text-sm">
              {STRIP.map((word) => (
                <span key={word} className="flex gap-6 whitespace-nowrap">
                  {word} <span className="text-accent">✦</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

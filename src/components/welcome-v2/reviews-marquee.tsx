import type { CSSProperties } from "react";
import styles from "./welcome-v2.module.css";

export type Review = { id: string; text: string; stars: number; item: string | null };

const TINTS = ["bg-card", "bg-accent-soft", "bg-success-soft-bg", "bg-warning-soft-bg", "bg-danger-soft-bg", "bg-raised"];
const FACES = ["(˘ᵕ˘)", "(•ᴗ•)", "(^‿^)", "(ᵔᴥᵔ)", "(◕‿◕)"];

/**
 * "What guests say": real rating comments, never invented, in two rows that
 * glide in opposite directions. Hover or focus pauses them.
 *
 * Each row renders its cards twice for the seamless loop. Only the first
 * pass is exposed to screen readers; padding copies and the second pass are
 * hidden, and with too few reviews for two rows the second row is a hidden
 * echo of the first.
 */
export function ReviewsMarquee({ reviews }: { reviews: Review[] }) {
  const split = reviews.length >= 6;
  const half = Math.ceil(reviews.length / 2);

  return (
    <section aria-labelledby="v2-reviews-heading" className="overflow-hidden py-band">
      <div className="mx-auto max-w-6xl px-4 text-center">
        <p className="eyebrow text-muted">From the counter</p>
        <h2 id="v2-reviews-heading" className="display mt-3 text-6xl text-ink">
          What{" "}
          <span className={`${styles.jelly} inline-block -rotate-1 rounded-lg bg-accent px-[0.16em] pt-[0.06em] text-accent-fg`}>
            guests
          </span>{" "}
          say
        </h2>
      </div>
      <div className="mt-heading grid gap-4 py-3">
        <Row reviews={split ? reviews.slice(0, half) : reviews} offset={0} />
        <Row reviews={split ? reviews.slice(half) : [...reviews].reverse()} offset={3} reverse hidden={!split} />
      </div>
    </section>
  );
}

function Row({
  reviews,
  offset,
  reverse = false,
  hidden = false,
}: {
  reviews: Review[];
  offset: number;
  reverse?: boolean;
  hidden?: boolean;
}) {
  // Enough cards that one pass is wider than the screen.
  const fill = Array.from({ length: Math.max(6, reviews.length) }, (_, i) => reviews[i % reviews.length]);

  return (
    <div className={styles.row} aria-hidden={hidden || undefined}>
      <div
        className={`${styles.track} ${reverse ? styles.reverse : ""}`}
        style={{ "--dur": `${fill.length * 7}s` } as CSSProperties}
      >
        {[0, 1].map((pass) => (
          <ul key={pass} className="flex gap-4 pr-4" aria-hidden={pass === 1 || undefined}>
            {fill.map((review, i) => (
              <Card
                key={`${review.id}-${i}`}
                review={review}
                tint={TINTS[(i + offset) % TINTS.length]}
                face={FACES[(i + offset) % FACES.length]}
                echo={i >= reviews.length}
                tilt={i % 2 ? "rotate-1" : "-rotate-1"}
              />
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}

function Card({ review, tint, face, echo, tilt }: { review: Review; tint: string; face: string; echo: boolean; tilt: string }) {
  const stars = Math.max(0, Math.min(5, Math.round(review.stars)));
  return (
    <li aria-hidden={echo || undefined} className={`${styles.spring} ${styles.lift} ${tilt} flex w-72 shrink-0 flex-col rounded-2xl p-5 text-left shadow-[var(--hi-shadow-md)] ${tint}`}>
      <p className="tracking-widest text-accent-ink" aria-label={`${stars} out of 5 stars`}>
        {"★".repeat(stars)}
        <span className="opacity-30">{"★".repeat(5 - stars)}</span>
      </p>
      <p className="mt-3 line-clamp-4 text-sm text-ink">{review.text}</p>
      <p className="mt-auto flex items-center gap-2 pt-4">
        <span aria-hidden="true" className="rounded-full bg-ink px-2 py-1 text-2xs text-surface">
          {face}
        </span>
        <span className="text-xs text-ink-soft">
          A Hiatus guest{review.item && <span className="text-muted"> · {review.item}</span>}
        </span>
      </p>
    </li>
  );
}

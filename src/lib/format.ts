export function formatPrice(amount: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount);
}

/**
 * The shop's clock. Every date the app shows is formatted in the shop's own
 * timezone, not the server's (UTC) and not the viewer's — a barista and the
 * owner looking at the same ticket must see the same time on it.
 */
export const SHOP_TIME_ZONE = "Asia/Manila";

const DATE_TIME = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: SHOP_TIME_ZONE,
});

const TIME_ONLY = new Intl.DateTimeFormat("en-PH", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: SHOP_TIME_ZONE,
});

const DATE_ONLY = new Intl.DateTimeFormat("en-PH", {
  dateStyle: "medium",
  timeZone: SHOP_TIME_ZONE,
});

export function formatDateTime(value: string | Date) {
  return DATE_TIME.format(new Date(value));
}

export function formatTime(value: string | Date) {
  return TIME_ONLY.format(new Date(value));
}

export function formatDate(value: string | Date) {
  return DATE_ONLY.format(new Date(value));
}

/**
 * A short, sayable order code.
 *
 * A UUID cannot be called across a counter. The first six hex characters can:
 * six characters is 16.7 million codes, which for the orders open at one shop
 * at one moment is collision-free in practice — and it is only ever used to
 * IDENTIFY a ticket to a human, never to look one up. Every query still uses
 * the full id.
 */
export function orderCode(id: string) {
  return `#${id.replace(/-/g, "").slice(0, 6).toUpperCase()}`;
}

/**
 * How long ago, in the terms a queue is discussed in.
 *
 * Deliberately coarse: a ticket is "12m" or "1h 5m", never "12 minutes and 43
 * seconds". The number is there to spot the one that has been waiting too
 * long, and extra precision only makes that scan slower.
 */
export function formatElapsed(from: string | Date, now: Date = new Date()) {
  const ms = now.getTime() - new Date(from).getTime();
  const minutes = Math.max(0, Math.floor(ms / 60000));

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

/** "12.5%" / "12%" — trims a trailing .0 so whole numbers read as whole. */
export function formatPercent(value: number) {
  return `${Number(value.toFixed(1))}%`;
}

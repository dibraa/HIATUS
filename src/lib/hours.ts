import type { BusinessHours } from "@/types/database";

/** Display order: the week as a customer reads a door sign, Monday first. */
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

/** "07:00" -> "7 AM", "20:30" -> "8:30 PM". Settings store 24-hour strings. */
export function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 && h < 24 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return m ? `${hour}:${String(m).padStart(2, "0")} ${suffix}` : `${hour} ${suffix}`;
}

export type HoursGroup = { days: string; hours: string };

/**
 * Collapses the seven-day timetable into door-sign rows: consecutive days with
 * identical hours share one row ("Mon–Thu · 7 AM – 8 PM"), closed days read
 * "Closed". A day missing from settings breaks the run rather than being
 * silently bridged, so a gap never makes two separate runs look like one.
 */
export function groupBusinessHours(hours: BusinessHours[]): HoursGroup[] {
  const byDay = new Map(hours.map((h) => [h.day, h]));
  const runs: { first: BusinessHours; last: BusinessHours; key: string; end: number }[] = [];

  WEEK_ORDER.forEach((day, index) => {
    const entry = byDay.get(day);
    if (!entry) return;
    const key = entry.closed ? "closed" : `${entry.open}-${entry.close}`;
    const previous = runs.at(-1);
    if (previous && previous.key === key && previous.end === index - 1) {
      previous.last = entry;
      previous.end = index;
    } else {
      runs.push({ first: entry, last: entry, key, end: index });
    }
  });

  const short = (h: BusinessHours) => h.label.slice(0, 3);
  return runs.map(({ first, last }) => ({
    days: first === last ? short(first) : `${short(first)}–${short(last)}`,
    hours: first.closed ? "Closed" : `${formatTime(first.open)} – ${formatTime(first.close)}`,
  }));
}

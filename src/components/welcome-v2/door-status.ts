import { formatTime } from "@/lib/hours";
import type { BusinessHours } from "@/types/database";

/** The open/closed sign's words, shown in the hero and the visit section. */
export function doorStatus(open: boolean, today: BusinessHours | null): string {
  const todayHours = today && !today.closed ? `${formatTime(today.open)} – ${formatTime(today.close)}` : null;
  if (open && today) return `Open now · until ${formatTime(today.close)}`;
  return todayHours ? `Closed · today ${todayHours}` : "Closed today";
}

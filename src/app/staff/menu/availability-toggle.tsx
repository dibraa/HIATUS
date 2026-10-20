"use client";

import { useTransition, type ReactNode } from "react";
import toast from "react-hot-toast";
import { setItemAvailability } from "@/app/actions/staff";

/**
 * One menu item, and the whole row is its sold-out switch.
 *
 * Flipping a drink off is the only job on this screen, done on a counter
 * tablet mid-rush, so the tap target is the full row rather than a 24px
 * track. Underneath it is still a real checkbox with `role="switch"`: that
 * gets keyboard operation, the correct announced role and state, and form
 * semantics for free.
 *
 * There is no optimistic update. The switch reflects what the database says,
 * and it says it after the round trip: a barista who taps "sold out" and sees
 * it flip instantly, only for the write to have failed, will walk away
 * believing the drink is off the menu while customers keep ordering it. The
 * ~200ms of honesty is worth more than the snappiness here, so the row says
 * "Saving…" while it waits instead of looking like the tap missed.
 */
export function AvailabilityRow({
  itemId,
  itemName,
  available,
  children,
}: {
  itemId: string;
  itemName: string;
  available: boolean;
  /** The item's photo and text, laid out to the left of the switch. */
  children: ReactNode;
}) {
  const [pending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      const { error } = await setItemAvailability(itemId, !available);
      if (error) toast.error(error);
      else
        toast.success(
          available ? `${itemName} marked sold out` : `${itemName} is back on`
        );
    });
  }

  return (
    <label
      className={`staff-panel flex items-center gap-3 p-3 transition-colors has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-ink ${
        pending ? "cursor-progress" : "cursor-pointer"
      } ${
        available
          ? "hover:border-line-strong"
          : "border-danger/30 bg-danger-soft-bg/30 hover:border-danger/60"
      }`}
    >
      {children}

      {/* Named for the question the switch answers ("Kape 1 available"), so
          "on" means available. The visible words below are not the name:
          read together they said "Available, Mark Kape 1 sold out, on". */}
      <input
        type="checkbox"
        role="switch"
        aria-label={`${itemName} available`}
        checked={available}
        disabled={pending}
        onChange={toggle}
        className="sr-only"
      />

      <span
        aria-hidden="true"
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          available ? "bg-secondary" : "bg-line-strong"
        } ${pending ? "opacity-60" : ""}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-card shadow-sm transition-[left] duration-(--hi-dur-base) ease-hi-spring ${
            available ? "left-[1.375rem]" : "left-0.5"
          }`}
        />
      </span>

      {/* The state is written as text as well as shown by the track position,
          so it survives a display that drops the colour (WCAG 1.4.1). A fixed
          width keeps the switch still when the word changes. */}
      <span
        className={`staff-caption w-[4.5rem] shrink-0 font-medium ${
          pending ? "text-muted" : available ? "text-success" : "text-danger"
        }`}
      >
        {pending ? "Saving…" : available ? "Available" : "Sold out"}
      </span>
    </label>
  );
}

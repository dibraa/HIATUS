"use client";

import { useTransition } from "react";
import toast from "react-hot-toast";
import { setItemAvailability } from "@/app/actions/staff";

/**
 * The sold-out switch.
 *
 * A real checkbox with `role="switch"`, not a styled div. That gets keyboard
 * operation, the correct announced role and state, and form semantics for
 * free — all of which a div with an onClick has to reimplement and usually
 * only partly does.
 *
 * There is no optimistic update. The switch reflects what the database says,
 * and it says it after the round trip: a barista who taps "sold out" and sees
 * it flip instantly, only for the write to have failed, will walk away
 * believing the drink is off the menu while customers keep ordering it. The
 * ~200ms of honesty is worth more than the snappiness here.
 */
export function AvailabilityToggle({
  itemId,
  itemName,
  available,
}: {
  itemId: string;
  itemName: string;
  available: boolean;
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
    <label className="flex cursor-pointer items-center gap-2.5">
      <input
        type="checkbox"
        role="switch"
        checked={available}
        disabled={pending}
        onChange={toggle}
        className="peer sr-only"
      />

      {/* The track. peer-focus-visible reproduces the app's focus ring, which
          the sr-only input cannot show on itself. */}
      <span
        aria-hidden="true"
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-150 ease-hi peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink ${
          available ? "bg-secondary" : "bg-line-strong"
        } ${pending ? "opacity-60" : ""}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-card shadow-sm transition-[left] duration-150 ease-hi ${
            available ? "left-[1.375rem]" : "left-0.5"
          }`}
        />
      </span>

      {/* The state is written as text as well as shown by the track position,
          so it survives a display that drops the colour (WCAG 1.4.1). */}
      <span
        className={`text-xs font-medium ${available ? "text-success" : "text-danger"}`}
      >
        {available ? "Available" : "Sold out"}
      </span>

      <span className="sr-only">
        {available ? `Mark ${itemName} sold out` : `Mark ${itemName} available`}
      </span>
    </label>
  );
}

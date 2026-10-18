"use client";

import { useState, useTransition } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { clockIn, clockOut } from "@/app/actions/staff";
import { formatPrice } from "@/lib/format";

/**
 * Clock in / clock out.
 *
 * Two forms rather than one toggle, because they ask for different things:
 * clocking in wants the float in the drawer, clocking out wants the count at
 * the end and room to explain a discrepancy. A single control that changed its
 * fields underneath you would be smaller and worse.
 *
 * Neither cash figure is required. A shop that does not count its float should
 * still be able to record hours — making the money mandatory would mean the
 * feature gets skipped entirely on the days it is least convenient, which are
 * exactly the days worth recording.
 */
export function ClockInForm() {
  const [opening, setOpening] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="staff-panel p-5"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const { error } = await clockIn(Number(opening) || 0);
          if (error) toast.error(error);
          else toast.success("Clocked in. Have a good shift.");
        });
      }}
    >
      <h2 className="display staff-section-title">Start your shift</h2>
      <p className="staff-lead mt-1.5">
        Count the float in the drawer before you begin, so the end-of-shift
        total has something to reconcile against.
      </p>

      <div className="mt-4 flex flex-col gap-1.5">
        <label
          htmlFor="opening-cash"
          className="text-sm font-medium text-ink-soft"
        >
          Opening float{" "}
          <span className="font-normal text-muted">(optional)</span>
        </label>
        <input
          id="opening-cash"
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          value={opening}
          onChange={(e) => setOpening(e.target.value)}
          placeholder="0.00"
          className="min-h-11 w-full rounded-md border border-line-strong bg-card px-3 text-sm text-ink placeholder:text-muted transition-colors hover:border-ink-soft numeric"
        />
      </div>

      <Button
        type="submit"
        size="lg"
        className="mt-5 w-full"
        disabled={pending}
      >
        {pending ? "Clocking in…" : "Clock in"}
      </Button>
    </form>
  );
}

export function ClockOutForm({ expectedCash }: { expectedCash: number }) {
  const [closing, setClosing] = useState("");
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();

  // A counted amount can be saved without claiming an unimplemented cash report.
  const counted = Number(closing);

  return (
    <form
      className="staff-panel p-5"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const { error } = await clockOut(
            closing === "" ? null : counted,
            note,
          );
          if (error) toast.error(error);
          else toast.success("Clocked out. Shift recorded.");
        });
      }}
    >
      <h2 className="display staff-section-title">End your shift</h2>
      <p className="staff-lead mt-1.5">
        Count the drawer and enter the total. Anything that does not match is
        worth a note while you still remember it.
      </p>

      <div className="mt-4 flex flex-col gap-1.5">
        <label
          htmlFor="closing-cash"
          className="text-sm font-medium text-ink-soft"
        >
          Closing cash{" "}
          <span className="font-normal text-muted">(optional)</span>
        </label>
        <input
          id="closing-cash"
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          value={closing}
          onChange={(e) => setClosing(e.target.value)}
          placeholder={expectedCash.toFixed(2)}
          aria-describedby="variance-hint"
          className="min-h-11 w-full rounded-md border border-line-strong bg-card px-3 text-sm text-ink placeholder:text-muted transition-colors hover:border-ink-soft numeric"
        />

        <p id="variance-hint" aria-live="polite" className="staff-caption">
          {closing === "" || !Number.isFinite(counted) ? (
            <span className="text-muted">
              Opening float: {formatPrice(expectedCash)}. This is a reference,
              not the expected closing balance.
            </span>
          ) : (
            <span className="text-muted">
              Closing cash: {formatPrice(counted)}. Saved when you clock out.
            </span>
          )}
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-1.5">
        <label
          htmlFor="shift-note"
          className="text-sm font-medium text-ink-soft"
        >
          Note <span className="font-normal text-muted">(optional)</span>
        </label>
        <textarea
          id="shift-note"
          rows={3}
          maxLength={280}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. ₱50 short — gave change twice on one order"
          className="min-h-11 w-full rounded-md border border-line-strong bg-card px-3 text-sm text-ink placeholder:text-muted transition-colors hover:border-ink-soft py-2.5"
        />
      </div>

      <Button
        type="submit"
        size="lg"
        variant="secondary"
        className="mt-5 w-full"
        disabled={pending}
      >
        {pending ? "Clocking out…" : "Clock out"}
      </Button>
    </form>
  );
}

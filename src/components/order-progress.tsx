import type { OrderStatus } from "@/types/database";

/**
 * The four-step journey of an order.
 *
 * Rendered as an ordered list, not a row of divs, because that is what it is —
 * and it means a screen reader announces "step 2 of 4" without any ARIA at
 * all. The current step carries `aria-current="step"`; completed steps say so
 * in visually-hidden text rather than relying on the tick mark, which is
 * decorative.
 *
 * Cancelled orders never render this. A progress bar for a journey that
 * stopped is worse than no progress bar — it implies the drink is still coming.
 */
const STEPS: { status: OrderStatus; label: string; detail: string }[] = [
  { status: "pending", label: "Received", detail: "We have your order" },
  { status: "preparing", label: "Making", detail: "Being prepared now" },
  { status: "ready", label: "Ready", detail: "Waiting for you" },
  { status: "completed", label: "Collected", detail: "All done" },
];

export function OrderProgress({ status }: { status: OrderStatus }) {
  if (status === "cancelled") return null;

  const currentIndex = STEPS.findIndex((s) => s.status === status);

  return (
    <ol className="flex gap-1.5" aria-label="Order progress">
      {STEPS.map((step, i) => {
        const done = i < currentIndex;
        const current = i === currentIndex;

        return (
          <li
            key={step.status}
            aria-current={current ? "step" : undefined}
            className="flex min-w-0 flex-1 flex-col gap-1.5"
          >
            {/* The bar is the visual cue; it is aria-hidden because the text
                below it already carries the same state. */}
            <span
              aria-hidden="true"
              className={`h-1.5 w-full rounded-full ${
                done || current ? "bg-accent" : "bg-line"
              }`}
            />

            <span className="flex min-w-0 flex-col">
              <span
                className={`truncate text-xs font-semibold ${
                  current ? "text-ink" : done ? "text-ink-soft" : "text-muted"
                }`}
              >
                {step.label}
                {done && <span className="sr-only"> — done</span>}
              </span>

              {/* The detail line only appears for the step you are on; four of
                  them at once is a paragraph, not a tracker. */}
              {current && (
                <span className="mt-0.5 truncate text-2xs text-muted">
                  {step.detail}
                </span>
              )}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

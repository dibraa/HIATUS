"use client";

import { useEffect, useState } from "react";
import { formatWait } from "@/lib/order-meta";

/**
 * "Usually ready in about 5 minutes", counting down.
 *
 * This is a client component for two reasons, and the second is the real one:
 *
 *   1. Reading the clock during a server render is impure — the value is baked
 *      into the HTML and then frozen, so a page held open would keep claiming
 *      the same remaining time however long it sat there. (The React Compiler's
 *      purity rule flags exactly this.)
 *   2. A wait estimate that does not move is not much of an estimate. Ticking
 *      it is the point.
 *
 * The first render deliberately shows nothing rather than a server-computed
 * guess: rendering a time on the server and a different one on the client is a
 * hydration mismatch, and an estimate that flickers to a different number on
 * load reads as broken.
 */
export function WaitEstimate({
  createdAt,
  typicalMinutes,
}: {
  createdAt: string;
  typicalMinutes: number;
}) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    function tick() {
      const elapsed = (Date.now() - new Date(createdAt).getTime()) / 60000;
      setRemaining(Math.max(0, typicalMinutes - elapsed));
    }

    tick();
    // Every 30s: the estimate is rounded to the nearest few minutes, so a
    // faster tick would redraw the same words over and over.
    const interval = setInterval(tick, 30_000);
    return () => clearInterval(interval);
  }, [createdAt, typicalMinutes]);

  if (remaining === null) {
    // Reserves the line so the panel does not jump when the estimate appears.
    return <p className="mt-2 h-5" aria-hidden="true" />;
  }

  return (
    <p className="mt-2 text-sm text-muted" aria-live="polite">
      {remaining > 0.5 ? (
        <>
          Usually ready in{" "}
          <span className="font-semibold text-ink-soft">{formatWait(remaining)}</span>{" "}
          from now.
        </>
      ) : (
        "Should be ready any moment now."
      )}
    </p>
  );
}

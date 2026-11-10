"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

const subscribeHydration = () => () => {};
const hydratedSnapshot = () => true;
const serverSnapshot = () => false;

/** Keeps an exiting panel mounted while its opacity transition finishes. */
export function usePresence(open: boolean, duration = 200) {
  const hydrated = useSyncExternalStore(subscribeHydration, hydratedSnapshot, serverSnapshot);
  const [present, setPresent] = useState(open);
  const [entered, setEntered] = useState(false);
  const [previous, setPrevious] = useState(open);

  // Reopening interrupts an exit before the next paint; it never waits for an effect.
  if (previous !== open) {
    setPrevious(open);
    if (open) {
      setPresent(true);
      setEntered(false);
    }
  }

  useEffect(() => {
    if (open) {
      const frame = requestAnimationFrame(() => setEntered(true));
      return () => cancelAnimationFrame(frame);
    }
    const timeout = setTimeout(() => setPresent(false), duration);
    return () => clearTimeout(timeout);
  }, [open, duration]);

  return { mounted: hydrated && (open || present), visible: open && entered };
}

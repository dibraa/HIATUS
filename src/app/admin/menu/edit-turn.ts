"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { MenuItem } from "@/types/database";

// Timestamp-ordered edit turns (server/src/services/menu-edit-turns.js). The first admin to click
// Edit edits; later clicks wait in line in click order. The server ends an editor's turn after
// 5 minutes without typing or clicking; this browser reports activity on each check-in.
const CHECK_IN_MS = 5_000;

export type EditTurn =
  | { status: "joining" }
  | { status: "waiting"; position: number; editor: { name: string; started_at: string } }
  | { status: "editing"; endsAt: number; item: MenuItem }
  | { status: "ended" }
  | { status: "error"; message: string };

type Reply =
  | { status: "editing"; ends_in_ms: number; item: MenuItem & { _id: string } }
  | { status: "waiting"; position: number; editor: { name: string; started_at: string } }
  | { status: "ended" }
  | { status?: undefined; error?: string };
const JOINING: EditTurn = { status: "joining" };

/** Holds this browser's place in the edit line for `session` (null = not in line). */
export function useEditTurn(itemId: string, session: string | null) {
  // State is tied to its session, so "Edit again" (a new session) always starts from "joining".
  const [state, setState] = useState<{ session: string | null; turn: EditTurn }>({ session: null, turn: JOINING });
  const active = useRef(false);
  const markActive = useCallback(() => { active.current = true; }, []);

  useEffect(() => {
    if (!session) return;
    const url = "/api/admin/menu-lock"; // static route: see its route.ts for why the id goes in the body
    const headers = { "Content-Type": "application/json" };
    let stopped = false, inLine = false;
    let latest: Promise<unknown> = Promise.resolve();
    const setTurn = (next: EditTurn | ((previous: EditTurn) => EditTurn)) => setState(previous => {
      const current = previous.session === session ? previous.turn : JOINING;
      return { session, turn: typeof next === "function" ? next(current) : next };
    });

    const checkIn = () => {
      if (stopped) return;
      const body = JSON.stringify({ id: itemId, session, join: !inLine, active: active.current });
      active.current = false;
      latest = fetch(url, { method: "POST", headers, body, cache: "no-store" }).then(async response => {
        const reply = await response.json().catch(() => ({})) as Reply;
        if (stopped || response.status === 409 || response.status >= 500) return; // busy or unreachable: the next check-in retries
        if (!response.ok || !reply.status) {
          stopped = true;
          setTurn({ status: "error", message: ("error" in reply && reply.error) || "This item can't be edited right now. Refresh the menu." });
          return;
        }
        if (reply.status === "ended") { stopped = true; setTurn({ status: "ended" }); return; }
        inLine = true;
        if (reply.status === "waiting") { setTurn({ status: "waiting", position: reply.position, editor: reply.editor }); return; }
        const endsAt = Date.now() + reply.ends_in_ms;
        // Only the first "editing" reply hands over the item; later ones keep the editor's draft.
        setTurn(previous => previous.status === "editing" ? { ...previous, endsAt } : { status: "editing", endsAt, item: { ...reply.item, id: reply.item._id } });
      }).catch(() => { /* Offline for a moment: the next check-in retries. */ });
    };
    const leave = () => { void fetch(url, { method: "DELETE", headers, body: JSON.stringify({ id: itemId, session }), keepalive: true, cache: "no-store" }).catch(() => {}); };
    const visible = () => { if (document.visibilityState === "visible") checkIn(); };

    checkIn();
    const timer = setInterval(checkIn, CHECK_IN_MS);
    document.addEventListener("visibilitychange", visible);
    window.addEventListener("pagehide", leave);
    return () => {
      stopped = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", visible);
      window.removeEventListener("pagehide", leave);
      // Leave only after the last check-in settles, so a late join can't keep a place in line.
      void latest.finally(leave);
    };
  }, [itemId, session]);

  return { turn: session && state.session === session ? state.turn : JOINING, markActive };
}

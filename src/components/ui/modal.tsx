"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "./button";

/**
 * A modal dialog for confirmations and focused tasks.
 *
 * Replaces `window.confirm` for destructive actions. The differences that
 * matter:
 *
 *   - FOCUS IS TRAPPED inside the dialog while it is open, and RETURNED to
 *     whatever had it before on close. A `window.confirm` steals focus from
 *     the page and drops it back to <body> when dismissed.
 *   - THE BACKDROP CLICKS THROUGH to close, which is the universal "I did
 *     not mean to open this" gesture. `window.confirm` has no such escape.
 *   - IT IS STYLED IN THE DESIGN SYSTEM, not the browser's native dialog. The
 *     wash behind it is the `scrim` token, which always darkens — an ink-based
 *     wash would turn into a pale film in dark mode, where ink is cream.
 *
 * `role="alertdialog"` is used (not `dialog`) because every current use is
 * a confirmation — the user must make a choice before proceeding. If a
 * non-confirmation modal is ever needed, the role should change to `dialog`.
 *
 * Entrance is a CSS keyframe (`.dialog-in` / `.scrim-in`), so it needs no
 * state; exit is a transition to the hidden classes, and the dialog stays
 * mounted for one `base` duration so that transition can play.
 */

/** Must match `--hi-dur-base` — the exit transition's length. */
const EXIT_MS = 200;

export function Modal({
  open,
  title,
  body,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  danger,
  className = "",
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
  className?: string;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const returnFocusTo = useRef<HTMLElement | null>(null);

  // Keep the dialog mounted while it animates out. This is React's
  // "adjust state while rendering" pattern for reacting to a prop change,
  // rather than a setState inside an effect body (which the compiler lint
  // flags, and which costs an extra render).
  const [prevOpen, setPrevOpen] = useState(open);
  const [exiting, setExiting] = useState(false);
  if (open !== prevOpen) {
    setPrevOpen(open);
    setExiting(!open);
  }

  useEffect(() => {
    if (!exiting) return;
    const timeout = setTimeout(() => setExiting(false), EXIT_MS);
    return () => clearTimeout(timeout);
  }, [exiting]);

  // Focus management: remember what had focus, move it to the primary action
  // (what the user came here to do), and hand it back on close.
  useEffect(() => {
    if (!open) return;
    returnFocusTo.current = document.activeElement as HTMLElement | null;
    // Long confirmations start at the heading so their content is not skipped
    // when focusing the action would scroll a constrained dialog to its end.
    const dialog = dialogRef.current;
    if (dialog && dialog.scrollHeight > dialog.clientHeight) {
      dialog.scrollTop = 0;
      titleRef.current?.focus({ preventScroll: true });
    } else {
      confirmRef.current?.focus();
    }
    return () => {
      returnFocusTo.current?.focus?.();
    };
  }, [open]);

  // Escape closes; Tab cycles inside the dialog instead of leaving it.
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
        return;
      }
      if (e.key !== "Tab") return;

      const dialog = dialogRef.current;
      if (!dialog) return;

      const focusable = dialog.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && (document.activeElement === first || document.activeElement === titleRef.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel]);

  if (!open && !exiting) return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${className}`}
      role="presentation"
      onClick={onCancel}
    >
      {/* Backdrop */}
      <div
        className={`scrim-in absolute inset-0 bg-scrim backdrop-blur-sm transition-opacity duration-(--hi-dur-base) ease-hi-out ${
          exiting ? "opacity-0" : "opacity-100"
        }`}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-body"
        className={`dialog-in relative max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto overscroll-contain rounded-2xl border border-line bg-card p-6 shadow-lg transition-[opacity,transform] duration-(--hi-dur-base) ease-hi-out ${
          exiting ? "scale-[0.97] opacity-0" : "scale-100 opacity-100"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 ref={titleRef} tabIndex={-1} id="modal-title" className="display wrap-anywhere text-2xl text-ink">
          {title}
        </h2>
        <p id="modal-body" className="mt-tight wrap-anywhere text-sm text-muted">
          {body}
        </p>

        <div className="mt-stack flex flex-wrap justify-end gap-3">
          <Button variant="ghost" size="md" className="min-w-0 max-w-full wrap-anywhere whitespace-normal" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            ref={confirmRef}
            variant={danger ? "danger" : "primary"}
            size="md"
            className="min-w-0 max-w-full wrap-anywhere whitespace-normal"
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.querySelector("dialog[open]") ?? document.body,
  );
}

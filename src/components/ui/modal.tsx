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
 *   - FOCUS IS TRAPPED inside the dialog while it is open, and returned to
 *     the trigger on close. A `window.confirm` steals focus from the page
 *     and drops it back to <body> when dismissed.
 *   - THE BACKDROP CLICKS THROUGH to close, which is the universal "I did
 *     not mean to open this" gesture. `window.confirm` has no such escape.
 *   - IT IS STYLED IN THE DESIGN SYSTEM, not the browser's native dialog.
 *
 * `role="alertdialog"` is used (not `dialog`) because every current use is
 * a confirmation — the user must make a choice before proceeding. If a
 * non-confirmation modal is ever needed, the role should change to `dialog`.
 */
export function Modal({
  open,
  title,
  body,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  danger,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    } else {
      setVisible(false);
      const timeout = setTimeout(() => setMounted(false), 200);
      return () => clearTimeout(timeout);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    // Focus the confirm button on open — the primary action is what the
    // user came here to do, and tabbing from there should cycle inside.
    confirmRef.current?.focus();

    // Trap focus inside the dialog
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
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
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

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
      onClick={onCancel}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-ink/50 backdrop-blur-sm transition-opacity duration-(--hi-dur-base) ease-hi-out ${
          visible ? "opacity-100" : "opacity-0"
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
        className={`relative w-full max-w-md rounded-2xl border border-line bg-card p-6 shadow-xl transition-[opacity,transform] duration-(--hi-dur-base) ease-hi-out ${
          visible ? "opacity-100 scale-100" : "opacity-0 scale-[0.97]"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="modal-title" className="display text-2xl text-ink">
          {title}
        </h2>
        <p id="modal-body" className="mt-2 text-sm text-muted">
          {body}
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" size="md" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            ref={confirmRef}
            variant={danger ? "danger" : "primary"}
            size="md"
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
